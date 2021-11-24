'use babel';

import EventEmitter from 'events';
import path from 'path';
import { shallowEqualObjects, shallowEqualArrays } from 'shallow-equal';
import AtomforcesDispatcher from './atomforces-dispatcher';
import ContestStore from './contest-store';
import ConfigStore from './config-store';

function check(output, expected, enableChecking, caseInsensitive, ignoreWhitespace, acceptNumericError) {
    if (!enableChecking) return null;

    if (!ignoreWhitespace) {
        const whitespaces1 = output.match(/\s+/g);
        const whitespaces2 = expected.match(/\s+/g);
        if (!shallowEqualArrays(whitespaces1, whitespaces2)) return false;
    }

    var tokens1 = output.split(/\s+/).filter(s => s !== '');
    var tokens2 = expected.split(/\s+/).filter(s => s !== '');
    if (tokens1.length !== tokens2.length) return false;

    if (caseInsensitive) {
        tokens1 = tokens1.map(s => s.toLowerCase());
        tokens2 = tokens2.map(s => s.toLowerCase());
    }

    for (var i = 0; i < tokens1.length; i++) {
        if (acceptNumericError) {
            const f1 = parseFloat(tokens1[i]);
            const f2 = parseFloat(tokens2[i]);
            if (f1 !== NaN || f2 !== NaN) {
                if (f1 === NaN || f2 === NaN) return false;
                if (Math.abs(f1 - f2) / Math.max(1, Math.abs(f2)) > 1e-6) return false;
                continue;
            }
        }
        if (tokens1[i] !== tokens2[i]) return false;
    }
    return true;
}

function checkExample(example, problem) {
    return check(example.output, example.expected,
        problem.enableChecking, problem.caseInsensitive,
        problem.ignoreWhitespace, problem.acceptNumericError);
}

// Problem: contestId, codeforcesContestId, siblingPrefix, index, name, filePath, didDownloadExamples, autoActivated
// examples (can be null, consisting of name, input, expected, output, checkingOk, producedStderr, exitCode, signal, outdated manuallyKilled, killProcess (not null only while running)),
//  submissions, compilation (never null, exit code, array of outputs, outdated, killProcess),
//  enableChecking, caseInsensitive, ignoreWhitespace, acceptNumericError
// Events: 'list' (if the list itself changes), ints (called when the corresponding problem changes)
class ProblemStore {

    constructor() {
        this._emitters = new Map();
        this._changes = new Set();
        this.dispatchToken = AtomforcesDispatcher.register(payload => {
            this._invokeOnDispatch(payload);
        });

        this.problems = new Map();
        this.standalonePathToIdMap = new Map();
    }

    serialize() {
        return Array.from(this.problems.entries()).map(([id, problem]) => [id, {
            ...problem,
            autoActivated: true,
            examples: null,
            compilation: {
                exitCode: null,
                output: null,
                killProcess: null,
                outdated: true
            }
        }]);
    }

    load(data) {
        this.problems = new Map(data);
        this.standalonePathToIdMap = new Map(data
                .filter(([id, problem]) => problem.contestId == null)
                .map(([id, problem]) => {
            return [problem.filePath, id];
        }));
    }

    getProblems() {
        return this.problems;
    }

    getStandalonePathToIdMap() {
        return this.standalonePathToIdMap;
    }

    addListener(event, callback) {
        if (!this._emitters.has(event)) this._emitters.set(event, new EventEmitter());
        this._emitters.get(event).on('c', callback);
    }

    removeListener(event, callback) {
        this._emitters.get(event).off('c', callback);
    }

    _invokeOnDispatch(payload) {
        this._changes.clear();
        this._onDispatch(payload);
        this._changes.forEach(change => {
            if (this._emitters.has(change)) {
                this._emitters.get(change).emit('c');
            }
        })
    }

    _clear() {
        this.problems = new Map();
        this._changes.add('list');
    }

    _setProblems(contestId, problems) {
        AtomforcesDispatcher.waitFor([ContestStore.dispatchToken]);
        const contest = ContestStore.getContests().get(contestId);
        problems.forEach(({codeforcesContestId, index, siblingPrefix, name}) => {
            const contestProblem = contest.problems.find(p => p.codeforcesContestId === codeforcesContestId && p.index === index);
            if (!contestProblem) return;
            const id = contestProblem.id;
            const oldProblem = this.problems.get(id) ||
                {
                    contestId,
                    codeforcesContestId,
                    index,
                    filePath: path.join(contest.filePath, ConfigStore.getFileStructureProblemDirectory()({ problem: index, siblingPrefix })),
                    examples: null,
                    didDownloadExamples: false,
                    autoActivated: true,
                    subcount: '',
                    submissions: [],
                    enableChecking: true,
                    caseInsensitive: true,
                    ignoreWhitespace: true,
                    acceptNumericError: false,
                    compilation: {
                        exitCode: null,
                        output: null,
                        killProcess: null,
                        outdated: true
                    }
                };
            const newProblem = {
                ...oldProblem,
                siblingPrefix,
                name
            }
            if (!this.problems.has(id)) this._changes.add('list');
            if (!shallowEqualObjects(oldProblem, newProblem)) {
                this.problems.set(id, newProblem);
                this._changes.add(id);
            }
        });
    }

    _addStandaloneProblem(problem) {
        const template = {
            index: 'A',
            name: null,
            contestId: null,
            examples: null,
            didDownloadExamples: null,
            autoActivated: true,
            submissions: null,
            enableChecking: true,
            caseInsensitive: true,
            ignoreWhitespace: true,
            acceptNumericError: false,
            compilation: {
                exitCode: null,
                output: null,
                killProcess: null,
                outdated: true
            }
        };
        const id = ContestStore.nextProblemId++;
        this.problems.set(id, {
            ...template,
            ...problem
        })
        this.standalonePathToIdMap.set(problem.filePath, id);
        this._changes.add('list');
    }

    _removeStandaloneProblem(problemId) {
        if (!this.problems.has(problemId)) return;
        this.problems.delete(problemId);
        this._changes.add('list');
    }

    _setSubmissions(problemId, submissions) {
        const oldProblem = this.problems.get(problemId);
        const submissionIds = submissions.map(submission => submission.codeforcesId);
        if (shallowEqualArrays(oldProblem.submissions, submissionIds)) return;

        const newProblem = {
            ...oldProblem,
            submissions: submissionIds
        };
        this.problems.set(problemId, newProblem);
        this._changes.add(problemId);
    }

    _updateCompilation(problemId, compilation) {
        const oldProblem = this.problems.get(problemId);

        const newProblem = {
            ...oldProblem,
            compilation: {
                ...oldProblem.compilation,
                ...compilation
            }
        };

        // cannot abort when shallow equal, because the output array can be mutated
        this.problems.set(problemId, newProblem);
        this._changes.add(problemId);
    }

    _updateProblem(problemId, problem) {
        const oldProblem = this.problems.get(problemId);
        if (!oldProblem) return;

        const newProblem = {
            ...oldProblem,
            ...problem
        };

        if ((oldProblem.enableChecking !== newProblem.enableChecking ||
            oldProblem.caseInsensitive !== newProblem.caseInsensitive ||
            oldProblem.ignoreWhitespace !== newProblem.ignoreWhitespace ||
            oldProblem.acceptNumericError !== newProblem.acceptNumericError) &&
            newProblem.examples) {
            newProblem.examples = newProblem.examples.map(example => {
                if (example.killProcess != null || example.output == null || example.expected == null)
                    return example;
                return {
                    ...example,
                    checkingOk: checkExample(example, newProblem)
                };
            });
        }

        if (shallowEqualObjects(oldProblem, newProblem)) return;
        this.problems.set(problemId, newProblem);
        this._changes.add(problemId);
    }

    _setExamples(problemId, examples) {
        const oldProblem = this.problems.get(problemId);

        const newProblem = {
            ...oldProblem,
            examples: examples.map(example => {
                return {
                    input: null,
                    expected: null,
                    output: null,
                    exitCode: null,
                    signal: null,
                    producedStderr: null,
                    killProcess: null,
                    checkingOk: null,
                    outdated: true,
                    manuallyKilled: false,
                    ...example
                };
            })
        };
        newProblem.examples.sort((e1, e2) => e1.name < e2.name ? -1 : (e1.name > e2.name ? 1 : 0));
        this.problems.set(problemId, newProblem);
        this._changes.add(problemId);
    }

    _updateExample(problemId, example) {
        const oldProblem = this.problems.get(problemId);

        const newProblem = { ...oldProblem };
        if (newProblem.examples == null) newProblem.examples = [];

        const oldExample = newProblem.examples.find(e => e.name === example.name) || {
            input: null,
            expected: null,
            output: null,
            exitCode: null,
            signal: null,
            producedStderr: null,
            killProcess: null,
            checkingOk: null,
            outdated: true,
            manuallyKilled: false
        };
        newProblem.examples = newProblem.examples.filter(e => e.name !== example.name);

        const newExample = {
            ...oldExample,
            ...example
        };

        if (newExample.killProcess == null && newExample.output != null && newExample.expected != null &&
            (oldExample.output !== newExample.output
                || oldExample.expected !== newExample.expected
                || oldExample.killProcess != null)) {
            newExample.checkingOk = checkExample(newExample, newProblem);
        } else newProblem.checkingOk = null;

        if (shallowEqualObjects(oldExample, newExample)) return;

        if (newExample.input != null || newExample.expected != null)
            newProblem.examples.push(newExample);

        newProblem.examples.sort((e1, e2) => e1.name < e2.name ? -1 : (e1.name > e2.name ? 1 : 0));
        if (shallowEqualArrays(oldProblem.examples, newProblem.examples)) return;
        this.problems.set(problemId, newProblem);
        this._changes.add(problemId);
    }

    _outdateAllExamples(problemId) {
        const problem = this.problems.get(problemId);
        if (!problem.examples) return;
        problem.examples.forEach(example => this._updateExample(problemId, { name: example.name, outdated: true }));
    }

    _outdateAllExamplesOfAllProblems() {
        Array.from(this.problems.keys()).forEach(problemId => this._outdateAllExamples(problemId));
    }

    _outdateAllCompilations() {
        Array.from(this.problems.keys()).forEach(problemId => {
            const oldProblem = this.problems.get(problemId);
            if (oldProblem.compilation.outdated) return;

            this.problems.set(problemId, {
                ...oldProblem,
                compilation: {
                    ...oldProblem.compilation,
                    outdated: true
                }
            })
            this._changes.add(problemId);
        });
    }

    _updateFilePaths() {
        Array.from(this.problems.keys()).forEach(problemId => {
            const oldProblem = this.problems.get(problemId);
            if (!oldProblem.contestId) return;

            const contest = ContestStore.getContests().get(oldProblem.contestId);
            if (!contest) return;

            this.problems.set(problemId, {
                ...oldProblem,
                filePath: path.join(contest.filePath, ConfigStore.getFileStructureProblemDirectory()({ problem: oldProblem.index, siblingPrefix: oldProblem.siblingPrefix })),
            });
            this._changes.add(problemId);
        });
    }

    _eraseExamples() {
        Array.from(this.problems.keys()).forEach(problemId => {
            const oldProblem = this.problems.get(problemId);
            if (!oldProblem.examples) return;

            this.problems.set(problemId, {
                ...oldProblem,
                examples: null
            })
            this._changes.add(problemId);
        });
    }

    _onDispatch(payload) {
        switch (payload.type) {
            case 'CLEAR_STORES':
                this._clear();
                break;
            case 'SET_PROBLEMS':
                this._setProblems(payload.contestId, payload.problems);
                break;
            case 'ADD_STANDALONE_PROBLEM':
                this._addStandaloneProblem(payload.problem);
                break;
            case 'REMOVE_STANDALONE_PROBLEM':
                this._removeStandaloneProblem(payload.problemId);
                break;
            case 'SET_SUBMISSIONS':
                this._setSubmissions(payload.problemId, payload.submissions);
                break;
            case 'UPDATE_COMPILATION':
                this._updateCompilation(payload.problemId, payload.compilation);
                break;
            case 'UPDATE_PROBLEM':
                this._updateProblem(payload.problemId, payload.problem);
                break;
            case 'SET_EXAMPLES':
                this._setExamples(payload.problemId, payload.examples);
                break;
            case 'UPDATE_EXAMPLE':
                this._updateExample(payload.problemId, payload.example);
                break;
            case 'OUTDATE_ALL_EXAMPLES':
                this._outdateAllExamples(payload.problemId);
                break;
            case 'SET_FILE_STRUCTURE_PROBLEM_DIRECTORY':
                this._updateFilePaths();
                this._outdateAllCompilations();
                this._eraseExamples();
                break;
            case 'SET_COMPILATION_COMMAND':
            case 'SET_FILE_STRUCTURE_SOURCE_FILE_NAME':
            case 'SET_FILE_STRUCTURE_EXECUTABLE_NAME':
                this._outdateAllCompilations();
                this._eraseExamples();
                break;
            case 'SET_FILE_STRUCTURE_INPUT_FILE_NAME':
            case 'SET_FILE_STRUCTURE_INPUT_FILE_REGEX':
            case 'SET_FILE_STRUCTURE_OUTPUT_FILE_NAME':
            case 'SET_FILE_STRUCTURE_OUTPUT_FILE_REGEX':
                this._eraseExamples();
                break;
            case 'SET_RUN_COMMAND':
                this._outdateAllExamplesOfAllProblems();
                break;
        }
    }

}

export default new ProblemStore();
