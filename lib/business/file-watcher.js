'use babel';

import chokidar from 'chokidar';
import fs from 'fs-plus';
import path from 'path';
import ContestStore from '../data/contest-store';
import ProblemStore from '../data/problem-store';
import ConfigStore from '../data/config-store';
import { removeContest, updateCompilation } from '../data/atomforces-actions';
import { pathIsInside } from '../utils';
import { fileChanged } from './example-updater';
import compile from './compiler';
import { runAllExamples, outdateAllExamples } from './example-runner';

var watcher = null;
const watched = new Set();

function searchContestRoot(pathToId, p) {
    p = path.normalize(p);
    while (!pathToId.has(p)) {
        const next = path.normalize(path.dirname(p));
        if (path.relative(next, p) === '') return null;
        p = next;
    }
    return p;
}

function changed(p) {
    const root = searchContestRoot(ContestStore.getPathToIdMap(), p);
    if (!root) return;

    const rel = path.relative(root, p);
    const contest = ContestStore.getContests().get(ContestStore.getPathToIdMap().get(root));
    if (!contest.problems) return;

    const problemIndex = Array.from(contest.problems.keys()).find(index => pathIsInside(ConfigStore.getFileStructureProblemDirectory()({ problem: index }), rel));
    if (!problemIndex) return;
    const problemId = contest.problems.get(problemIndex);
    const problem = ProblemStore.getProblems().get(problemId);
    if (!problem) return;

    if (path.relative(p, path.join(problem.filePath, ConfigStore.getFileStructureSourceFileName()({ problem: problemIndex }))) === '') {
        updateCompilation(problemId, { outdated: true });
        if (ConfigStore.getAutoCompilation() && problem.autoActivated) {
            compile(problemId);
        }
    } else if (path.relative(p, path.join(problem.filePath, ConfigStore.getFileStructureExecutableName()({ problem: problemIndex }))) == '') {
        outdateAllExamples(problemId);
        if (ConfigStore.getAutoEvaluation() && problem.autoActivated && !problem.compilation.killProcess) {
            runAllExamples(problemId);
        }
    } else {
        fileChanged(problemId, p, path.relative(problem.filePath, p));
    }
}

function directoryRemoved(p) {
    if (!ContestStore.getPathToIdMap().has(p)) return;
    const contestId = ContestStore.getPathToIdMap().get(p);
    removeContest(contestId);
}

function updateWatcher() {
    Array.from(ContestStore.getContests().entries()).forEach(([contestId, contest]) => {
        if (watched.has(contestId)) return;
        if (fs.existsSync(contest.filePath)) {
            watcher.add(contest.filePath);
            watched.add(contest.filePath);
        } else {
            removeContest(contestId);
        }
    });
    watched.forEach(filePath => {
        if (!ContestStore.getPathToIdMap().has(filePath)) {
            watcher.unwatch(filePath);
            watched.delete(filePath);
        }
    });
}

export function startWatching() {
    watcher = chokidar.watch([], {
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 100
        }
    });
    watcher.on('add', changed);
    watcher.on('change', changed);
    watcher.on('unlink', changed);
    watcher.on('unlinkDir', directoryRemoved);

    updateWatcher();
    ContestStore.addListener('list', updateWatcher);
}
