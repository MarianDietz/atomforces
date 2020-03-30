'use babel';

import fs from 'fs-plus';
import path from 'path';
import CodeforcesScraper from './codeforces-scraper';
import ContestStore from '../data/contest-store';
import ProblemStore from '../data/problem-store';
import { ensureLogin } from './login-updater';
import { handleError } from '../utils'

export default function submit(contestId, problemId) {
    return ensureLogin().then(() => {
        const contest = ContestStore.getContests().get(contestId);
        const problem = ProblemStore.getProblems().get(problemId);
        if (!contest || !problem) return;

        const contestCodeforcesId = contest.codeforcesId;
        const problemIndex = problem.index;
        return new Promise((resolve, reject) => {
            fs.readFile(path.join(problem.filePath, `${problem.index}.cpp`), { encoding: 'utf8' }, (err, data) => {
                if (err) {
                    handleError(err, 'Could not read source file for submitting');
                    resolve();
                    return;
                }
                CodeforcesScraper.submit(contestCodeforcesId, problemIndex, data).catch(error => {
                    handleError(err, 'Could not submit source file');
                }).then(() => resolve());
            });
        });
    });
}
