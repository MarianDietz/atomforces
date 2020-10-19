'use babel';

import path from 'path';
import fs from 'fs-plus';
import CodeforcesScraper from './codeforces-scraper';
import ContestStore from '../data/contest-store';
import ProblemStore from '../data/problem-store';
import SubmissionStore from '../data/submission-store';
import ConfigStore from '../data/config-store';
import { updateContest, setProblems, setSubmissions, updateProblem } from '../data/atomforces-actions';
import { handleError } from '../utils';
import atomforces from '../atomforces';
import { loadExamplesSync, downloadExamples } from './example-updater';
import { prepareContestDirectory } from './directory-preparer';

export default class ContestUpdater {

    constructor(contestId) {
        this.contestId = contestId;

        this.informationTimer = null;
        this.informationFetching = false;

        this.submissionsTimer = null;
        this.submissionsFetching = false;

        this.stopped = false;
        this.fastSubmissionCheckingMode = false;
    }

    start() {
        const contest = ContestStore.getContests().get(this.contestId);
        if (!contest) return;
        this.informationTimer = setTimeout(() => this.fetchInformation(), 1000);
    }

    executeNow() {
        if (this.informationTimer) {
            clearTimeout(this.informationTimer);
            this.informationTimer = setTimeout(() => this.fetchInformation(), 0);
        }
        if (this.submissionsTimer) {
            clearTimeout(this.submissionsTimer);
            this.submissionsTimer = setTimeout(() => this.fetchSubmissions(), 0);
        }
    }

    startFastSubmissionCheckingMode() {
        this.fastSubmissionCheckingMode = true;
        if (this.submissionsTimer) {
            clearTimeout(this.submissionsTimer);
            this.submissionsTimer = setTimeout(() => this.fetchSubmissions(), 0);
        } else if (!this.submissionsFetching) {
            this.submissionsTimer = setTimeout(() => this.fetchSubmissions(), 0);
        }
    }

    stop() {
        this.stopped = true;
        if (this.informationTimer) {
            clearTimeout(this.informationTimer);
            this.informationTimer = null;
        }
        if (this.submissionsTimer) {
            clearTimeout(this.submissionsTimer);
            this.submissionsTimer = null;
        }
    }

    fetchSubmissions() {
        this.submissionsTimer = null;
        this.submissionsFetching = true;

        this.refreshSubmissions()
            .then(() => {
                const contest = ContestStore.getContests().get(this.contestId);
                if (!contest) return 1000;

                var hasRunningSubmission = false;
                var hasPendingSubmission = false;
                if (contest.problems) contest.problems.forEach(problemId => {
                    const problem = ProblemStore.getProblems().get(problemId);
                    if (problem) problem.submissions.forEach(submissionId => {
                        const submission = SubmissionStore.getSubmissions().get(submissionId);
                        if (!submission) return;
                        if (submission.verdict == null) {
                            hasPendingSubmission = true;
                        } else if (submission.verdict === 'TESTING') {
                            hasRunningSubmission = true;
                        }
                    })
                });

                if (hasRunningSubmission || hasPendingSubmission) {
                    if (!this.fastSubmissionCheckingMode)
                        this.startFastSubmissionCheckingMode();
                    return 0;
                }
                if (contest.phase !== 'FINISHED') return 5 * 1000;
                else return 30 * 1000;
            }).catch(error => {
                handleError(error, 'Could not refresh submissions.');
                return 1000;
            }).then(time => {
                this.submissionsFetching = false;
                if (this.stopped) return;

                this.submissionsTimer = setTimeout(() => this.fetchSubmissions(), time);
            });
    }

    fetchInformation() {
        this.informationTimer = null;
        this.informationFetching = true;

        this.refreshBeginning()
            .then(() => this.refreshBasicInformationAndTasks())
            .then(() => this.downloadExamples())
            .then(() => {
                const contest = ContestStore.getContests().get(this.contestId);
                if (!contest) return 1000;

                var time = 30 * 1000;
                if (contest.phase === 'BEFORE' && contest.localStartTime) {
                    time = Math.max(0, Math.min(time, contest.localStartTime - Date.now() + 100));
                }
                return time;
            }).catch(error => {
                handleError(error, 'Could not refresh contest information.');
                return 1000;
            }).then(time => {
                this.informationFetching = false;
                if (this.stopped) return;

                this.informationTimer = setTimeout(() => this.fetchInformation(), time);
                if (!this.submissionsTimer && !this.submissionsFetching)
                    this.submissionsTimer = setTimeout(() => this.fetchSubmissions(), 0);
            });
    }

    refreshSubmissions() {
        var contest = ContestStore.getContests().get(this.contestId);
        if (!contest || contest.phase === 'BEFORE') return Promise.resolve();

        return CodeforcesScraper.getSubmissions({
            contestId: contest.codeforcesId,
            handle: atom.config.get('atomforces.codeforcesHandle')
        }).then(submissions => {
            contest = ContestStore.getContests().get(this.contestId);
            if (!contest || !contest.problems) return;

            const problemSubmissions = new Map();
            submissions.forEach(({ problemIndex, submission }) => {
                if (!problemSubmissions.has(problemIndex)) problemSubmissions.set(problemIndex, []);
                problemSubmissions.get(problemIndex).push(submission);
            });
            Array.from(problemSubmissions.entries()).forEach(([index, list]) => {
                const problemId = contest.problems.get(index);
                if (!problemId)
                    throw { error: 'atomforces', message: 'Found submission for unknown task.', data: taskIndex };
                setSubmissions(problemId, list);
            });
        });
    }

    refreshBeginning() {
        const contest = ContestStore.getContests().get(this.contestId);
        if (!contest || contest.phase !== 'BEFORE') return Promise.resolve();

        return CodeforcesScraper.getBasicContest(contest.codeforcesId).then(data => {
            if (!ContestStore.getContests().has(this.contestId)) return;
            updateContest(this.contestId, this.convertBasicContestData(data));
        });
    }

    refreshBasicInformationAndTasks() {
        var contest = ContestStore.getContests().get(this.contestId);
        if (contest.phase === 'BEFORE') return;

        return CodeforcesScraper.getContestInformationAndTasks(contest.codeforcesId).then(({ contest: data, problems }) => {
            contest = ContestStore.getContests().get(this.contestId);
            if (!contest) return;
            updateContest(this.contestId, this.convertBasicContestData(data));

            const createFiles = contest.problems == null;
            setProblems(this.contestId, new Map(problems
                .filter(problem => problem.type === 'PROGRAMMING')
                .map(problem => {
                    return [problem.index, {
                        index: problem.index,
                        name: problem.name
                    }];
                })
            ));
            if (createFiles) prepareContestDirectory(this.contestId);
        });
    }

    downloadExamples() {
        var contest = ContestStore.getContests().get(this.contestId);
        if (contest.phase === 'BEFORE' || !contest.problems) return;

        const promises = [];
        Array.from(contest.problems.values()).forEach(problemId => {
            var problem = ProblemStore.getProblems().get(problemId);
            if (!problem || problem.didDownloadExamples) return;
            promises.push(downloadExamples(problemId));
        });
        return Promise.all(promises);
    }

    convertBasicContestData(data) {
        return {
            name: data.name,
            phase: data.phase,
            type: data.type,
            duration: data.durationSeconds,
            startTime: data.startTimeSeconds,
            localStartTime: data.phase === 'BEFORE' ? Date.now() - data.relativeTimeSeconds * 1000 : null
        }
    }

}
