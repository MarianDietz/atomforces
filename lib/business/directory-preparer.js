'use babel';

import path from 'path';
import fs from 'fs-plus';
import { updateProblem } from '../data/atomforces-actions';
import ContestStore from '../data/contest-store';
import ProblemStore from '../data/problem-store';
import ConfigStore from '../data/config-store';
import atomforces from '../atomforces';
import { handleError } from '../utils';

function getSnippet() {
    const service = atomforces.getSnippets();
    const scope = ConfigStore.getTemplateSnippetScope();
    const prefix = ConfigStore.getTemplateSnippetPrefix();
    if (service && scope && prefix) {
        const snippets = service.snippetsForScopes([scope]);
        if (snippets && snippets[prefix]) {
            return snippets[prefix];
        } else {
            atom.notifications.addWarning('The configured template snippet could not be found.',
                { details: 'Please adjust your Atomforces settings.' })
        }
    }
    return null;
}

export function prepareProblemDirectory(problemId, snippet, activateEditor) {
    var problem = ProblemStore.getProblems().get(problemId);
    if (!problem) return;

    updateProblem(problemId, { autoActivated: false });

    const sourceFilePath = path.join(problem.filePath, ConfigStore.getFileStructureSourceFileName()({ problem: problem.index }));
    atom.workspace.open(sourceFilePath, { split: 'up', activateItem: activateEditor }).then(editor => {
        const snippetsService = atomforces.getSnippets();
        if (!fs.existsSync(sourceFilePath) && snippetsService && snippet)
            snippetsService.insertSnippet(snippet, editor, null);
        editor.save();
    }).catch(error => {
        handleError(error, 'Could not prepare problem directory.');
    });

    setTimeout(() => {
        updateProblem(problemId, { autoActivated: true });
    }, 1000); // wait for some time so that we don't compile immediately after creating the file
}

export function prepareStandaloneProblem(problemId) {
    prepareProblemDirectory(problemId, getSnippet(), true);
}

export function prepareContestDirectory(contestId) {
    const snippet = getSnippet();
    const contest = ContestStore.getContests().get(contestId);

    const problems = Array.from(contest.problems.values());
    if (problems.length > 0) {
        prepareProblemDirectory(problems[0], snippet, true);
        problems.slice(1).reverse().forEach(problem => {
            prepareProblemDirectory(problem, snippet, false);
        });
    }
}
