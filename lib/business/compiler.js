'use babel';

import { spawn } from 'node-pty';
import ProblemStore from '../data/problem-store';
import ConfigStore from '../data/config-store';
import { updateCompilation } from '../data/atomforces-actions';

export default function compile(problemId) {
    var problem = ProblemStore.getProblems().get(problemId);
    if (!problem) return;

    if (problem.compilation.killProcess) problem.compilation.killProcess();
    problem = ProblemStore.getProblems().get(problemId);

    var killed = false;
    const outputArray = [];

    var term = spawn('/bin/sh', ['-c', ConfigStore.getCompilationCommand()({ problem: problem.index })],
        { name: 'xterm-color', cwd: problem.filePath });

    const kill = () => {
        if (!killed) {
            killed = true;
            term.kill();
            updateCompilation(problemId, {
                output: null,
                exitCode: null,
                killProcess: null,
                outdated: true
            });
        }
    };

    updateCompilation(problemId, {
        output: outputArray,
        exitCode: null,
        outdated: false,
        killProcess: kill
    });

    term.on('data', data => {
        if (killed) return;
        outputArray.push(data);
        updateCompilation(problemId, {});
    });

    term.on('exit', exitCode => {
        if (killed) return;
        updateCompilation(problemId, {
            exitCode,
            killProcess: null
        });
    });
}
