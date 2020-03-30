'use babel';

import fs from 'fs-plus';
import path from 'path';
import { spawn } from 'child_process';
import ProblemStore from '../data/problem-store';
import { updateExample } from '../data/atomforces-actions';
import { handleError } from '../utils';

export function runExample(problemId, exampleName) {
    var problem = ProblemStore.getProblems().get(problemId);
    if (!problem || !problem.examples) return;
    var example = problem.examples.find(example => example.name === exampleName);
    if (!example) return;

    fs.open(path.join(problem.filePath, 'examples', `${exampleName}.in`), 'r', (err, input) => {
        problem = ProblemStore.getProblems().get(problemId);
        if (!problem || !problem.examples) return;
        example = problem.examples.find(example => example.name === exampleName);
        if (!example) return;

        if (example.killProcess) example.killProcess();

        if (err) {
            handleError(err, 'Error during example execution');
            updateExample(problemId, {
                name: exampleName,
                exitCode: -1,
                signal: -1,
                output: '',
                outdated: false,
                manuallyKilled: false
            });
            return;
        }

        var killed = false;
        var output = '';
        const process = spawn('./a.out', [], {
            cwd: problem.filePath,
            stdio: [input, 'pipe', 'pipe']
        });

        const kill = () => {
            killed = true;
            process.kill();
            fs.close(input);
            updateExample(problemId, {
                name: exampleName,
                killProcess: null,
                exitCode: null,
                signal: null,
                producedStderr: false,
                output: output && output.size > 1024 ? 'Output is too large' : null,
                manuallyKilled: true
            });
        };

        updateExample(problemId, {
            name: exampleName,
            outdated: false,
            killProcess: kill,
            exitCode: null,
            signal: null,
            producedStderr: false,
            manuallyKilled: false,
            output
        });

        process.on('error', err => {
            if (!killed) updateExample(problemId, {
                name: exampleName,
                exitCode: -1,
                signal: -1,
                output: '',
                killProcess: null
            });
            killed = true;
            fs.close(input);
        });

        process.on('exit', (exitCode, signal) => {
            if (killed) return;
            killed = true;
            fs.close(input);
            updateExample(problemId, {
                name: exampleName,
                exitCode,
                signal,
                killProcess: null
            });
        });

        if (process.stdout) process.stdout.on('data', data => {
            if (killed) return;
            output += data;
            if (output.length > 1024) {
                kill();
                return;
            }
            updateExample(problemId, {
                name: exampleName,
                output
            });
        });

        if (process.stderr) process.stderr.on('data', data => {
            if (killed) return;
            updateExample(problemId, {
                name: exampleName,
                producedStderr: true
            });
        });
    })
}

export function runAllExamples(problemId) {
    var problem = ProblemStore.getProblems().get(problemId);
    if (!problem || !problem.examples) return;
    problem.examples.forEach(example => runExample(problemId, example.name));
}
