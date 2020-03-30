'use babel';

import EventEmitter from 'events';
import { shallowEqualObjects } from 'shallow-equal';
import AtomforcesDispatcher from './atomforces-dispatcher';

// Contest: filePath, codeforcesId, name, phase, type, duration, startTime, localStartTime, problems
// Events: 'list' (if the list itself changes), ints (called when the corresponding contest changes)
class ContestStore {

    constructor() {
        this._emitters = new Map();
        this._changes = new Set();
        this.dispatchToken = AtomforcesDispatcher.register(payload => {
            this._invokeOnDispatch(payload);
        });

        this.nextId = 1;
        this.nextProblemId = 1;
        this.pathToId = new Map();
        this.contests = new Map();
    }

    serialize() {
        return {
            nextId: this.nextId,
            nextProblemId: this.nextProblemId,
            contests: Array.from(this.contests.entries()).map(([id, contest]) => {
                return {
                    id,
                    contest: {
                        ...contest,
                        problems: contest.problems == null ? null : Array.from(contest.problems.entries())
                    }
                };
            })
        }
    }

    load(data) {
        this.nextId = data.nextId;
        this.nextProblemId = data.nextProblemId;
        this.pathToId = new Map(data.contests.map(({id, contest}) => [contest.filePath, id]));
        this.contests = new Map(data.contests.map(({id, contest}) => [id, {
            ...contest,
            problems: contest.problems == null ? null : new Map(contest.problems)
        }]));
    }

    addListener(event, callback) {
        if (!this._emitters.has(event)) this._emitters.set(event, new EventEmitter());
        this._emitters.get(event).on('c', callback);
    }

    removeListener(event, callback) {
        this._emitters.get(event).off('c', callback);
    }

    getPathToIdMap() {
        return this.pathToId;
    }

    getContests() {
        return this.contests;
    }

    _clear() {
        this.pathToId = new Map();
        this.contests = new Map();
        this._changes.add('list');
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

    _addContest(contest) {
        const { filePath, codeforcesId, name, phase, type, duration, startTime } = contest;
        if (this.pathToId.has(filePath))
            this.contests.delete(this.pathToId.get(filePath));
        this.pathToId.set(filePath, this.nextId);
        this.contests.set(this.nextId, {
            filePath,
            codeforcesId,
            name,
            phase,
            type,
            duration,
            startTime,
            localStartTime: null,
            problems: null
        });
        this.nextId++;
        this._changes.add('list');
    }

    _updateContest(contestId, contest) {
        const { name, phase, type, duration, startTime, localStartTime } = contest;
        const oldContest = this.contests.get(contestId);
        const newContest = {
            ...oldContest,
            name,
            phase,
            type,
            duration,
            startTime,
            localStartTime
        }
        if (!shallowEqualObjects(oldContest, newContest)) {
            this.contests.set(contestId, newContest);
            this._changes.add(contestId);
        }
    }

    _removeContest(contestId) {
        const contest = this.contests.get(contestId);
        if (!contest) return;
        this.pathToId.delete(contest.filePath);
        this.contests.delete(contestId);
        this._changes.add('list');
    }

    _setProblems(contestId, problems) {
        const oldContest = this.contests.get(contestId);
        const changed = oldContest.problems == null ||
            Array.from(oldContest.problems.keys()).find(k => !problems.has(k)) ||
            Array.from(problems.keys()).find(k => !oldContest.problems.has(k));
        if (!changed) return;

        const newProblems = new Map(Array.from(problems.keys()).map(key => {
            if (oldContest.problems == null || !oldContest.problems.has(key)) {
                return [key, this.nextProblemId++];
            } else return [key, oldContest.problems.get(key)];
        }));
        const newContest = {
            ...oldContest,
            problems: newProblems
        };
        this.contests.set(contestId, newContest);
        this._changes.add(contestId);
    }

    _onDispatch(payload) {
        switch (payload.type) {
            case 'CLEAR_STORES':
                this._clear();
                break;
            case 'ADD_CONTEST':
                this._addContest(payload.contest);
                break;
            case 'UPDATE_CONTEST':
                this._updateContest(payload.contestId, payload.contest);
                break;
            case 'REMOVE_CONTEST':
                this._removeContest(payload.contestId);
                break;
            case 'SET_PROBLEMS':
                this._setProblems(payload.contestId, payload.problems);
                break;
        }
    }

}

export default new ContestStore();
