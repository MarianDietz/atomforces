'use babel';

import EventEmitter from 'events';
import { shallowEqualObjects } from 'shallow-equal';
import AtomforcesDispatcher from './atomforces-dispatcher';

// Events: 'list' (if the list itself changes), ints (called when the corresponding submission changes)
// Indexed using the codeforces ids
class SubmissionStore {

    constructor() {
        this._emitters = new Map();
        this._changes = new Set();
        this.dispatchToken = AtomforcesDispatcher.register(payload => {
            this._invokeOnDispatch(payload);
        });

        this.submissions = new Map();
    }

    serialize() {
        return Array.from(this.submissions.entries());
    }

    load(data) {
        this.submissions = new Map(data);
    }

    getSubmissions() {
        return this.submissions;
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
        this.submissions = new Map();
        this._changes.add('list');
    }

    _setSubmissions(problemId, submissions) {
        submissions.forEach(submission => {
            const { codeforcesId, verdict, passedTestCount, testset, time,
                memory, language, participantType, participantStartTime,
                creationTime, relativeTime, codeforcesContestId } = submission;
            const oldSubmission = this.submissions.get(codeforcesId) || { codeforcesId };
            const newSubmission = {
                ...oldSubmission,
                verdict,
                passedTestCount,
                testset,
                time,
                memory,
                language,
                participantType,
                participantStartTime,
                creationTime,
                relativeTime,
                codeforcesContestId
            }
            if (!this.submissions.has(codeforcesId)) {
                this._changes.add('list');
            }
            if (!shallowEqualObjects(oldSubmission, newSubmission)) {
                this.submissions.set(codeforcesId, newSubmission);
                this._changes.add(codeforcesId);
            }
        });
    }

    _onDispatch(payload) {
        switch (payload.type) {
            case 'CLEAR_STORES':
                this._clear();
                break;
            case 'SET_SUBMISSIONS':
                this._setSubmissions(payload.problemId, payload.submissions);
                break;
        }
    }

}

export default new SubmissionStore();
