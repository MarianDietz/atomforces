'use babel';

import { CompositeDisposable, Disposable } from 'atom';
import config from './config';
import Dialog from './dialog/dialog';
import CodeforcesScraper from './business/codeforces-scraper';
import { startWatching } from './business/file-watcher';
import { prepareStandaloneProblem } from './business/directory-preparer';
import { handleError, pathIsInside } from './utils';
import { addContest, clearStores, updateLogin, addStandaloneProblem,
    setProgrammingLanguage, setCompilationCommand, setAutoCompilation,
    setAutoEvaluation, setTemplateSnippetPrefix, setTemplateSnippetScope,
    setFileStructureProblemDirectory, setFileStructureSourceFileName,
    setFileStructureExecutableName,
    setFileStructureInputFileName, setFileStructureInputFileRegex,
    setFileStructureOutputFileName, setFileStructureOutputFileRegex } from './data/atomforces-actions';
import AtomforcesRoot from './view/AtomforcesRoot';
import LoginStore from './data/login-store';
import ContestStore from './data/contest-store';
import ProblemStore from './data/problem-store';
import ConfigStore from './data/config-store';
import SubmissionStore from './data/submission-store';

const TERMINAL_TAB_URI = 'terminal-tab://';

export default {

    config,
    atomforcesView: null,
    subscriptions: null,
    treeView: null,
    snippets: null,

    activate(state) {
        if (state) {
            const { login, contests, problems, submissions } = state;
            if (login && contests && problems && submissions) {
                LoginStore.load(login);
                ContestStore.load(contests);
                ProblemStore.load(problems);
                SubmissionStore.load(submissions);
                console.log(LoginStore);
                console.log(ContestStore);
                console.log(ProblemStore);
                console.log(SubmissionStore);
            }
        }

        startWatching();

        require('atom-package-deps').install('atomforces').then(() => {
            this.subscriptions = new CompositeDisposable(
                atom.config.observe('atomforces.codeforcesHandle', newValue => {
                    updateLogin({ handle: newValue, loggedIn: false });
                }),
                atom.config.observe('atomforces.programmingLanguage', newValue => {
                    setProgrammingLanguage(newValue);
                }),
                atom.config.observe('atomforces.compilationCommand', newValue => {
                    setCompilationCommand(newValue);
                }),
                atom.config.observe('atomforces.autoCompilation', newValue => {
                    setAutoCompilation(newValue);
                }),
                atom.config.observe('atomforces.autoEvaluation', newValue => {
                    setAutoEvaluation(newValue);
                }),
                atom.config.observe('atomforces.templateSnippet.prefix', newValue => {
                    setTemplateSnippetPrefix(newValue);
                }),
                atom.config.observe('atomforces.templateSnippet.scope', newValue => {
                    setTemplateSnippetScope(newValue);
                }),
                atom.config.observe('atomforces.fileStructure.problemDirectory', newValue => {
                    setFileStructureProblemDirectory(newValue);
                }),
                atom.config.observe('atomforces.fileStructure.sourceFileName', newValue => {
                    setFileStructureSourceFileName(newValue);
                }),
                atom.config.observe('atomforces.fileStructure.executableName', newValue => {
                    setFileStructureExecutableName(newValue);
                }),
                atom.config.observe('atomforces.fileStructure.inputFileName', newValue => {
                    setFileStructureInputFileName(newValue);
                }),
                atom.config.observe('atomforces.fileStructure.inputFileRegex', newValue => {
                    setFileStructureInputFileRegex(newValue);
                }),
                atom.config.observe('atomforces.fileStructure.outputFileName', newValue => {
                    setFileStructureOutputFileName(newValue);
                }),
                atom.config.observe('atomforces.fileStructure.outputFileRegex', newValue => {
                    setFileStructureOutputFileRegex(newValue);
                }),
                atom.workspace.addOpener(uri => {
                    if (uri.startsWith(TERMINAL_TAB_URI + '/')) {
                        const TerminalSession = require(atom.packages.resolvePackagePath('terminal-tab') + '/lib/terminal-session');
                        return new TerminalSession({
                            workingDirectory: uri.substring(TERMINAL_TAB_URI.length)
                        });
                    }
                }),
                atom.workspace.addOpener(uri => {
                    if (uri === 'atom://atomforces') {
                        return new AtomforcesRoot(state.atomforcesViewState);
                    }
                }),
                atom.commands.add('atom-workspace', {
                    'atomforces:toggle': () => this.toggle(),
                    'atomforces:connect-contest': () => this.startConnectContest(),
                    'atomforces:connect-problem': () => this.startConnectProblem(),
                    'atomforces:clear': clearStores
                }),
                new Disposable(() => {
                    atom.workspace.getPaneItems().forEach(item => {
                        if (item instanceof AtomforcesRoot) {
                            item.destroy();
                        }
                    });
                })
            );
        });
    },

    serialize() {
        return {
            login: LoginStore.serialize(),
            contests: ContestStore.serialize(),
            problems: ProblemStore.serialize(),
            submissions: SubmissionStore.serialize()
        };
    },

    deactivate() {
        if (this.subscriptions) this.subscriptions.dispose();
        CodeforcesScraper.destroy();
    },

    consumeTreeView(treeView) {
        this.treeView = treeView;
    },

    consumeSnippets(snippets) {
        this.snippets = snippets;
    },

    toggle() {
        atom.workspace.toggle('atom://atomforces');
    },

    checkCollision(filePath) {
        if (Array.from(ContestStore.getPathToIdMap().keys()).find(p => pathIsInside(p, filePath))) {
            atom.notifications.addError('The selected directory is inside of another connected contest');
            return true;
        }
        if (Array.from(ContestStore.getPathToIdMap().keys()).find(p => pathIsInside(filePath, p))) {
            atom.notifications.addError('The selected directory contains another connected contest');
            return true;
        }
        if (Array.from(ProblemStore.getStandalonePathToIdMap().keys()).find(p => pathIsInside(p, filePath))) {
            atom.notifications.addError('The selected directory is inside of another standalone problem');
            return true;
        }
        if (Array.from(ProblemStore.getStandalonePathToIdMap().keys()).find(p => pathIsInside(filePath, p))) {
            atom.notifications.addError('The selected directory contains another standalone problem');
            return true;
        }
        return false;
    },

    startConnectContest() {
        if (!this.treeView) return;
        const paths = this.treeView.selectedPaths();
        if (!paths || paths.length !== 1) return;
        var path = paths[0];
        if (!path) return;
        this.dialog = new Dialog({
            promptText: 'Please enter the contest id',
            onConfirm: contestId => this.connectContest(path, parseInt(contestId)),
            checkInput: text => /^\d+$/.test(text)
        });
        this.dialog.attach();
    },

    connectContest(filePath, contestId) {
        this.dialog.close();
        if (this.checkCollision(filePath)) return;
        CodeforcesScraper.getBasicContest(contestId).then(contestData => {
            addContest({
                filePath,
                codeforcesId: contestId,
                name: contestData.name,
                phase: contestData.phase,
                type: contestData.type,
                duration: contestData.durationSeconds,
                startTime: contestData.startTimeSeconds
            });
        }).catch(error => {
            handleError(error, 'Could not connect contest.');
        });
    },

    startConnectProblem() {
        if (!this.treeView) return;
        const paths = this.treeView.selectedPaths();
        if (!paths || paths.length !== 1) return;
        var path = paths[0];
        if (!path) return;
        this.dialog = new Dialog({
            promptText: 'Please enter the problem index (used for filenames)',
            onConfirm: problemIndex => this.connectProblem(path, problemIndex),
            checkInput: text => /^.+$/.test(text)
        });
        this.dialog.attach();
    },

    connectProblem(filePath, index) {
        this.dialog.close();
        if (this.checkCollision(filePath)) return;
        addStandaloneProblem({
            filePath,
            index
        });
        prepareStandaloneProblem(ContestStore.nextProblemId - 1);
    },

    getTreeView() {
        return this.treeView;
    },

    getSnippets() {
        return this.snippets;
    }

};
