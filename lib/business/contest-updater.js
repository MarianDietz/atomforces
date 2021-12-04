'use babel';

import path from 'path';
import fs from 'fs-plus';
import opn from 'opn';
import CodeforcesScraper from './codeforces-scraper';
import ContestStore from '../data/contest-store';
import ProblemStore from '../data/problem-store';
import SubmissionStore from '../data/submission-store';
import ConfigStore from '../data/config-store';
import { updateContest, setProblems, setSubmissions, updateProblem } from '../data/atomforces-actions';
import { handleError, findDivFromContestName, getSiblingContestPrefix } from '../utils';
import atomforces from '../atomforces';
import { loadExamplesSync, downloadAllExamples } from './example-updater';
import { prepareContestDirectory } from './directory-preparer';

export default class ContestUpdater {

    constructor(contestId) {
        this.contestId = contestId;

        this.informationTimer = null;
        this.informationFetching = false;

        this.submissionsTimer = null;
        this.submissionsFetching = false;

        this.stopped = false;

        this.connectionOk = false;
        this.connectionInfoCallback = null;
    }

    setConnectionInfoCallback(callback) {
        this.connectionInfoCallback = callback;
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

    fetchSubmissionsNow() {
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
                this.updateConnectionOk(true);

                const contest = ContestStore.getContests().get(this.contestId);
                if (!contest) return 1000;

                var hasRunningSubmission = false;
                var hasPendingSubmission = false;
                if (contest.problems) contest.problems.forEach(({id: problemId}) => {
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

                if (hasRunningSubmission || hasPendingSubmission) return 0;
                else if (contest.phase !== 'FINISHED') return 5 * 1000;
                else return 30 * 1000;
            }).catch(error => {
                this.updateConnectionOk(false);
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
            .then(() => this.refreshSubCount())
            .then(() => this.refreshStandings())
            .then(() => downloadAllExamples(this.contestId, false))
            .then(() => {
                this.updateConnectionOk(true);
                const contest = ContestStore.getContests().get(this.contestId);
                if (!contest) return 1000;

                var time = 30 * 1000;
                if (contest.phase === 'BEFORE' && contest.localStartTime) {
                    time = Math.max(0, Math.min(time, contest.localStartTime - Date.now() + 100));
                }
                return time;
            }).catch(error => {
                this.updateConnectionOk(false);
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

    refreshStandings(){
      console.log("FETCHING STANDINGS");
      var contest = ContestStore.getContests().get(this.contestId);
      if (contest.phase === 'BEFORE') return;

      const handle = atom.config.get('atomforces.codeforcesHandle');
      if(!handle) return
      var promises = []
      promises.push(
        CodeforcesScraper.getUserRank(contest.codeforcesId, handle).then(rank => {
          updateContest(this.contestId, {"rank": rank})
        })
      )

      var friends = atom.config.get('atomforces.options.friends')
      if(Array.isArray(friends)){
        promises.push(
          CodeforcesScraper.getUserStandings(contest.codeforcesId, friends).then(res => {
            updateContest(this.contestId, {"standings": res})
          }).catch(err=> {
            if(err!=null){
              updateContest(this.contestId, {"standings": {err: err}})
            }
          })
        )
      }

      return Promise.all(promises)
    }

    refreshSubCount(){
      var contest = ContestStore.getContests().get(this.contestId);
      if (contest.phase === 'BEFORE') return;

      return Promise.all([contest.codeforcesId].concat(contest.siblingContests.map(c => c.codeforcesId)).map(codeforcesId => {
        return CodeforcesScraper.getProblemSubCount(codeforcesId).then(subcount=> ({codeforcesId, subcount}))
      })).then(subcounts=>{
        contest.problems.forEach(problem=>{
          var cont = subcounts.find(s => s.codeforcesId==problem.codeforcesContestId)
          if(cont==null) return
          updateProblem(problem.id, {subcount: cont.subcount[problem.index]})
        })
      })
    }

    refreshSubmissions() {
        var contest = ContestStore.getContests().get(this.contestId);
        if (!contest || contest.phase === 'BEFORE') return Promise.resolve();
        const handle = atom.config.get('atomforces.codeforcesHandle');

        return Promise.all([contest.codeforcesId].concat(contest.siblingContests.map(c => c.codeforcesId)).map(codeforcesId =>
            CodeforcesScraper.getSubmissions({ contestId: codeforcesId, handle }).then(submissions => ({ codeforcesId, submissions }))
        )).then(contestSubmissions => {
            this.updateConnectionOk(true);
            contest = ContestStore.getContests().get(this.contestId);
            if (!contest || !contest.problems) return;
            const map = new Map();
            contestSubmissions.forEach(({ codeforcesId, submissions }) => {
                if (!map.has(codeforcesId)) map.set(codeforcesId, new Map());
                submissions.forEach(({ problemIndex, submission }) => {
                    if (!map.get(codeforcesId).has(problemIndex)) map.get(codeforcesId).set(problemIndex, []);
                    map.get(codeforcesId).get(problemIndex).push(submission);
                });
            });
            Array.from(map.entries()).forEach(([codeforcesId, problemSubmissions]) => {
                Array.from(problemSubmissions.entries()).forEach(([index, list]) => {
                    const problem = contest.problems.find(problem => problem.alternativeIdentifications.find(alt => alt.codeforcesContestId === codeforcesId && alt.index === index));
                    if (!problem)
                        throw { error: 'atomforces', message: 'Found submission for unknown task.', data: { codeforcesId, index } };
                    setSubmissions(problem.id, list);
                });
            });
        });
    }

    refreshBeginning() {
        const contest = ContestStore.getContests().get(this.contestId);
        if (!contest || contest.phase !== 'BEFORE') return Promise.resolve();

        return CodeforcesScraper.getBasicContest(contest.codeforcesId).then(data => {
            this.updateConnectionOk(true);
            if (!ContestStore.getContests().has(this.contestId)) return;
            updateContest(this.contestId, this.convertBasicContestData(data));
        });
    }

    refreshBasicInformationAndTasks() {
        var contest = ContestStore.getContests().get(this.contestId);
        if (contest.phase === 'BEFORE') return;

        if(contest.opened==false && atom.config.get('atomforces.options.openProblemSet')){
          var url = `https://codeforces.com/contest/${contest.codeforcesId}/problems`
          opn(url).catch(e => console.log(e))
          updateContest(this.contestId, {opened: true})
        }

        return CodeforcesScraper.getBasicContest(contest.codeforcesId).then(data => {
            this.updateConnectionOk(true);
            if (!ContestStore.getContests().has(this.contestId)) return;
            updateContest(this.contestId, this.convertBasicContestData(data));
            return Promise.all([contest.codeforcesId].concat(contest.siblingContests.map(c => c.codeforcesId)).map(codeforcesId =>
                CodeforcesScraper.getContestTasks(codeforcesId).then(problems => ({ codeforcesId, problems }))));
        }).then(problems => {
            this.updateConnectionOk(true);
            contest = ContestStore.getContests().get(this.contestId);
            if (!contest) return;

            const contests = [{ codeforcesId: contest.codeforcesId, name: contest.name }].concat(contest.siblingContests);
            contests.sort(function(a, b) {
                const div1 = findDivFromContestName(a.name);
                const div2 = findDivFromContestName(b.name);
                if (div1 === -1) {
                    if (div2 === -1) return a.codeforcesId - b.codeforcesId;
                    else return 1;
                } else {
                    if (div2 === -1) return -1;
                    else if (div1 === div2) return a.codeforcesId - b.codeforcesId;
                    else return div2 - div1;
                }
            });

            const done = new Set();
            const res = [];
            const allProblems = [];

            problems[0].problems.forEach(problem => {
                done.add(problem.name);
            });
            contests.forEach(({ codeforcesId, name }) => {
                const siblingPrefix = codeforcesId === contest.codeforcesId ? null : getSiblingContestPrefix(name, codeforcesId);
                const c = problems.find(({ codeforcesId: c }) => c === codeforcesId);
                if (!c) return;
                const problemset = c.problems.filter(problem => problem.type === 'PROGRAMMING');
                if (!problemset) return;
                problemset.forEach(problem => {
                    allProblems.push({ codeforcesContestId: codeforcesId, index: problem.index, name: problem.name });
                    if (done.has(problem.name) && codeforcesId !== contest.codeforcesId) return;
                    done.add(problem.name);
                    res.push({ codeforcesContestId: codeforcesId, index: problem.index, name: problem.name, siblingPrefix, alternativeIdentifications: [] });
                })
            });
            allProblems.forEach(problem => {
                const p = res.find(p => p.name === problem.name);
                p.alternativeIdentifications.push({ codeforcesContestId: problem.codeforcesContestId, index: problem.index });
            });

            const createFiles = contest.problems == null;
            setProblems(this.contestId, res);
            if (createFiles) prepareContestDirectory(this.contestId);
        });
    }

    convertBasicContestData(data) {
        const res = {
            name: data.name,
            phase: data.phase,
            type: data.type,
            duration: data.durationSeconds,
            startTime: data.startTimeSeconds,
            localStartTime: data.phase === 'BEFORE' ? Date.now() - data.relativeTimeSeconds * 1000 : null
        };
        if (Array.isArray(data.siblingContests))
            res.siblingContests = data.siblingContests;
        return res;
    }

    updateConnectionOk(ok) {
        // console.log('Connection ok: ' + ok)
        if (this.connectionOk != ok && this.connectionInfoCallback) this.connectionInfoCallback(ok);
        this.connectionOk = ok;
    }

}
