'use babel';

import { CompositeDisposable, Disposable } from 'atom';
import config from './config';
import Dialog from './dialog/dialog';
import CodeforcesScraper from './business/codeforces-scraper';
import { startWatching } from './business/file-watcher';
import { handleError } from './utils';
import { addContest, clearStores, updateLogin } from './data/atomforces-actions';
import AtomforcesRoot from './view/AtomforcesRoot';
import LoginStore from './data/login-store';
import ContestStore from './data/contest-store';
import ProblemStore from './data/problem-store';
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
        LoginStore.data.handle = atom.config.get('atomforces.codeforcesHandle');

        startWatching();

        require('atom-package-deps').install('atomforces').then(() => {
            this.subscriptions = new CompositeDisposable(
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
                    'atomforces:clear': clearStores
                }),
                new Disposable(() => {
                    atom.workspace.getPaneItems().forEach(item => {
                        if (item instanceof AtomforcesRoot) {
                            item.destroy();
                        }
                    });
                }),
                atom.config.observe('atomforces.codeforcesHandle', newValue => {
                    updateLogin({ handle: newValue, loggedIn: false });
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

    getTreeView() {
        return this.treeView;
    },

    getSnippets() {
        return this.snippets;
    }

};
