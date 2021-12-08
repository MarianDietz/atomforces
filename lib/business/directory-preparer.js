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

export function prepareProblemDirectory(problemId, snippet, activateEditor, closeAfterOpening, toOpen=true) {
    var problem = ProblemStore.getProblems().get(problemId);
    if (!problem) return;

    updateProblem(problemId, { autoActivated: false });
    const sourceFilePath = path.join(problem.filePath, ConfigStore.getFileStructureSourceFileName()({ problem: problem.index, siblingPrefix: problem.siblingPrefix }));

    if(toOpen){
      atom.workspace.open(sourceFilePath, { split: 'up', activateItem: activateEditor }).then(editor => {
          const snippetsService = atomforces.getSnippets();
          if (!fs.existsSync(sourceFilePath) && snippetsService && snippet)
              snippetsService.insertSnippet(snippet, editor, null);
          editor.save().then(() => {
              if (closeAfterOpening) {
                  const pane = atom.workspace.paneForURI(sourceFilePath);
                  if (pane) {
                      const item = pane.itemForURI(sourceFilePath);
                      if (item) {
                          pane.destroyItem(item);
                      }
                  }
              }
          });
      }).catch(error => {
          handleError(error, 'Could not prepare problem directory.');
      });
    }else{
      fs.writeFileSync(sourceFilePath, snippet.body)
    }

    setTimeout(() => {
        updateProblem(problemId, { autoActivated: true });
    }, 1000); // wait for some time so that we don't compile immediately after creating the file
}

export function prepareStandaloneProblem(problemId) {
    prepareProblemDirectory(problemId, getSnippet(), true, false);
}

export function prepareContestDirectory(contestId) {
    const snippet = getSnippet();
    const contest = ContestStore.getContests().get(contestId);
    var openChoice = atom.config.get('atomforces.options.openAllFiles');

    const problems = contest.problems.filter(p => p.codeforcesContestId === contest.codeforcesId); // Do not open problems of sibling contests
    if (problems && problems.length > 0) {
        prepareProblemDirectory(problems[0].id, snippet, true, false);
        problems.slice(1).reverse().forEach(problem => {
            prepareProblemDirectory(problem.id, snippet, false, false, openChoice);
        });
    }

    // Prepare problems that should not be opened directly
    const backgroundProblems = contest.problems.filter(p => p.codeforcesContestId !== contest.codeforcesId);
    backgroundProblems.forEach(problem => {
        prepareProblemDirectory(problem.id, snippet, false, true, openChoice);
    })
}
