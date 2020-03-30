'use babel';

import fs from 'fs-plus';
import path from 'path';
import ProblemStore from '../data/problem-store';
import { setExamples, updateExample } from '../data/atomforces-actions';

function getFilenameInformation(name) {
    if (name.endsWith('.in')) return [true, name.substring(0, name.length - 3)];
    else if (name.endsWith('.out')) return [false, name.substring(0, name.length - 4)];
    else return [null, null];
}

export function fileChanged(problemId, p, fileName) {
    const [isInput, name] = getFilenameInformation(fileName);
    if (isInput == null) return;

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

export function loadExamplesSync(problemId) {
    const problem = ProblemStore.getProblems().get(problemId);
    if (!problem || problem.examples != null) return;

    const examplesDir = path.join(problem.filePath, 'examples');
    var files = null;
    try { files = fs.readdirSync(examplesDir) } catch(_) { return }

    const inputs = new Map();
    const outputs = new Map();
    const names = new Set();
    files.forEach(fileName => {
        const [isInput, name] = getFilenameInformation(fileName);
        if (isInput == null) return;

        var size = 0;
        try { size = fs.statSync(path.join(examplesDir, fileName)).size; } catch(_) {}
        if (size > 1024) {
            if (isInput) inputs.set(name, 'File too large');
            else outputs.set(name, 'File too large');
            names.add(name);
            return;
        }

        var content = null;
        try { content = fs.readFileSync(path.join(examplesDir, fileName), { encoding: 'utf8' }); } catch(_) { return }
        if (isInput) inputs.set(name, content);
        else outputs.set(name, content);
        names.add(name);
    });

    setExamples(problemId, Array.from(names.values()).map(name => {
        return {
            name,
            input: inputs.get(name),
            expected: outputs.get(name)
        };
    }));
}
