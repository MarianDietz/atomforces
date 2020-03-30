'use babel';

import chokidar from 'chokidar';
import fs from 'fs-plus';
import path from 'path';
import ContestStore from '../data/contest-store';
import ProblemStore from '../data/problem-store';
import { removeContest, updateCompilation } from '../data/atomforces-actions';
import { pathIsInside } from '../utils';
import { fileChanged } from './example-updater';
import compile from './compiler';
import { runAllExamples } from './example-runner';

var watcher = null;

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

    const problemIndex = Array.from(contest.problems.keys()).find(index => pathIsInside(index, rel));
    if (!problemIndex) return;
    const problemId = contest.problems.get(problemIndex);

    if (path.relative(rel, path.join(problemIndex, `${problemIndex}.cpp`)) === '') {
        updateCompilation(problemId, { outdated: true });
        compile(problemId);
    } else if (path.relative(rel, path.join(problemIndex, 'a.out')) == '') {
        const problem = ProblemStore.getProblems().get(problemId);
        if (problem && !problem.compilation.killProcess) {
            runAllExamples(problemId);
        }
    } else if (path.relative(rel, path.join(problemIndex, 'examples')) === '..') {
        fileChanged(problemId, p, path.relative(path.join(problemIndex, 'examples'), rel));
    }
}

function directoryRemoved(p) {
    const root = searchContestRoot(ContestStore.getPathToIdMap(), p);
    if (!root) return;

    const contestId = ContestStore.getPathToIdMap().get(root);
    removeContest(contestId);
}

function createWatcher() {
    if (watcher) watcher.close();
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

    Array.from(ContestStore.getContests().entries()).forEach(([contestId, contest]) => {
        if (fs.existsSync(contest.filePath)) {
            watcher.add(contest.filePath);
        } else {
            removeContest(contestId);
        }
    });
}

export function startWatching() {
    createWatcher();
    ContestStore.addListener('list', () => {
        createWatcher();
    });
}
