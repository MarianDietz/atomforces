'use babel';

import fs from 'fs-plus';
import path from 'path';
import ProblemStore from '../data/problem-store';
import ContestStore from '../data/contest-store';
import ConfigStore from '../data/config-store';
import CodeforcesScraper from './codeforces-scraper';
import { setExamples, updateExample, updateProblem } from '../data/atomforces-actions';
import { handleError } from '../utils';

function getFilenameInformation(problem, fileName) {
    fileName = fileName.replace("\\", "/")
    var result = ConfigStore.getFileStructureInputFileRegex().exec(fileName);
    if (result && result.length === 2) {
        const name = result[1];
        if (ConfigStore.getFileStructureInputFileName()({ problem: problem.index, name }) === fileName)
            return [true, name];
    }
    result = ConfigStore.getFileStructureOutputFileRegex().exec(fileName);
    if (result && result.length === 2) {
        const name = result[1];
        if (ConfigStore.getFileStructureOutputFileName()({ problem: problem.index, name }) === fileName)
            return [false, name];
    }
    return [null, null];
}

export function loadExamplesSync(problemId) {
    const problem = ProblemStore.getProblems().get(problemId);
    if (!problem || problem.examples != null) return;

    const inputs = new Map();
    const outputs = new Map();
    const names = new Set();
    try {
        fs.traverseTreeSync(problem.filePath, absolutePath => {
            const fileName = path.relative(problem.filePath, absolutePath);
            // console.log(fileName);
            const [isInput, name] = getFilenameInformation(problem, fileName);
            if (isInput == null) return;

            var size = 0;
            try { size = fs.statSync(path.join(examplesDir, fileName)).size; } catch(_) {}
            if (size > 1024) {
                if (isInput) inputs.set(name, 'File too large');
                else outputs.set(name, 'File too large');
                names.add(name);
                return;
            }

            var content = fs.readFileSync(absolutePath, { encoding: 'utf8' });
            if (isInput) inputs.set(name, content);
            else outputs.set(name, content);
            names.add(name);
        }, () => true);
    } catch (error) {
        handleError(error, 'Could not read examples.');
    }

    setExamples(problemId, Array.from(names.values()).map(name => {
        return {
            name,
            input: inputs.get(name),
            expected: outputs.get(name)
        };
    }));
}

export function fileChanged(problemId, p, fileName) {
    const problem = ProblemStore.getProblems().get(problemId);
    if (!problem) return;

    if (!problem.examples) {
        loadExamplesSync(problemId);
        return;
    }

    const [isInput, name] = getFilenameInformation(problem, fileName);
    if (isInput == null) return;

    if (isInput && problem.examples) {
        const example = problem.examples.find(e => e.name === name);
        if (example && example.killProcess) example.killProcess();
        updateExample(problemId, { name, outdated: true });
    }

    fs.stat(p, (err, data) => {
        var size = 0;
        if (!err) size = data.size;

        if (size > 1024) {
            const example = { name };
            if (isInput) example.input = 'File too large';
            else example.expected = 'File too large';
            updateExample(problemId, example);
            return;
        }

        fs.readFile(p, { encoding: 'utf8' }, (err, data) => {
            var content = null;
            if (!err) content = data;

            const example = { name };
            if (isInput) example.input = content;
            else example.expected = content;

            updateExample(problemId, example);
        });
    });
}

export function downloadExamples(problemId) {
    var problem = ProblemStore.getProblems().get(problemId);
    if (!problem) return;

    return CodeforcesScraper.getSamples(problem.codeforcesContestId, problem.index).then(examples => {
        loadExamplesSync(problemId);
        problem = ProblemStore.getProblems().get(problemId);
        if (!problem || !problem.examples) return;

        var nextIndex = 0;
        examples.forEach(([input, output]) => {
            const existing = problem.examples.find(e => e.input === input);
            if (existing) {
                if (existing.output !== output) {
                    // Update output of the matching input file
                    const outPath = path.join(problem.filePath, ConfigStore.getFileStructureOutputFileName()({ problem: problem.index, name: existing.name }));
                    fs.writeFileSync(outPath, output);
                }
                return;
            }

            nextIndex++;
            while (problem.examples.find(e => e.name == nextIndex)) nextIndex++;
            const inPath = path.join(problem.filePath, ConfigStore.getFileStructureInputFileName()({ problem: problem.index, name: nextIndex }));
            const outPath = path.join(problem.filePath, ConfigStore.getFileStructureOutputFileName()({ problem: problem.index, name: nextIndex }));
            fs.writeFileSync(inPath, input);
            fs.writeFileSync(outPath, output);
        });

        updateProblem(problemId, { didDownloadExamples: true });
    }).catch(error => {
        if (error.error !== 'atomforces') throw error;
        atom.notifications.addWarning(`Could not fetch examples for problem ${problem.index}`, { detail: error.message });
        updateProblem(problemId, { didDownloadExamples: true });
    });
}

export function downloadAllExamples(contestId, forceRedownload) {
    var contest = ContestStore.getContests().get(contestId);
    if (!contest || (contest.phase === 'BEFORE' || !contest.problems)) return;

    const promises = [];
    contest.problems.forEach(({ id: problemId }) => {
        var problem = ProblemStore.getProblems().get(problemId);
        if (!problem || (!forceRedownload && problem.didDownloadExamples)) return;
        promises.push(downloadExamples(problemId));
    });
    return Promise.all(promises);
}
