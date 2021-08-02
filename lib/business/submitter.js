'use babel';

import fs from 'fs-plus';
import path from 'path';
import CodeforcesScraper from './codeforces-scraper';
import ContestStore from '../data/contest-store';
import ProblemStore from '../data/problem-store';
import ConfigStore from '../data/config-store';
import { ensureLogin } from './login-updater';
import { handleError } from '../utils'

export default function submit(problemId) {
    return ensureLogin().then(() => {
        const problem = ProblemStore.getProblems().get(problemId);
        if (!problem) return;

        const codeforcesContestId = problem.codeforcesContestId;
        const problemIndex = problem.index;
        return new Promise((resolve, reject) => {
            fs.readFile(path.join(problem.filePath, ConfigStore.getFileStructureSourceFileName()({ problem: problemIndex, siblingPrefix: problem.siblingPrefix })), { encoding: 'utf8' }, (err, data) => {
                if (err) {
                    handleError(err, 'Could not read source file for submitting');
                    resolve();
                    return;
                }
                CodeforcesScraper.submit(codeforcesContestId, problemIndex, data, ConfigStore.getProgrammingLanguage()).then(() => {
                    atom.notifications.addInfo('Your code for problem ' + problem.index + ' has been submitted.');
                }).catch(error => {
                    handleError(error, 'Could not submit source file');
                }).then(() => resolve());
            });
        });
    });
}
