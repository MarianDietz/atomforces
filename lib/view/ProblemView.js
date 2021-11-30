'use babel';

import React from 'react';
import SubmissionsSection from './SubmissionsSection';
import CompilationSection from './CompilationSection';
import ExamplesSection from './ExamplesSection';
import SubmitButton from './SubmitButton';
import compile from '../business/compiler';
import submit from '../business/submitter';
import { loadExamplesSync, downloadExamples } from '../business/example-updater';
import { runAllExamples } from '../business/example-runner';
import { handleError } from '../utils';

export default class ProblemView extends React.Component {

    constructor(props) {
        super(props);

        this.state = { isSubmitting: false };

        this.compile = this.compile.bind(this);
        this.runExamples = this.runExamples.bind(this);
        this.killExamples = this.killExamples.bind(this);
        this.openTerminal = this.openTerminal.bind(this);
        this.downloadExamples = this.downloadExamples.bind(this);
        this.submitClicked = this.submitClicked.bind(this);
    }

    componentDidMount() {
        this.loadExamples();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.problemId == this.props.problemId) return;
        this.loadExamples();
        this.setState({ isSubmitting: false });
    }

    componentWillUnmount() {
        if (this.exampleLoadTimer) clearTimeout(this.exampleLoadTimer);
    }

    loadExamples() {
        if (this.props.problem) {
            // defer loading to avoid dispatching during dispatch (e.g. adding this contest)
            if (this.exampleLoadTimer) clearTimeout(this.exampleLoadTimer);
            this.exampleLoadTimer = setTimeout(() => {
                this.exampleLoadTimer = null;
                loadExamplesSync(this.props.problemId);
            }, 5);
        }
    }

    compile() {
        compile(this.props.problemId);
    }

    runExamples() {
        runAllExamples(this.props.problemId);
    }

    killExamples() {
        this.props.problem.examples.forEach(example => {
            if (example.killProcess) example.killProcess();
        });
    }

    openTerminal() {
        atom.workspace.open('terminal-tab://' + this.props.problem.filePath);
    }

    downloadExamples() {
        downloadExamples(this.props.problemId).then(() => {
            atom.notifications.addSuccess(`Examples for problem ${this.props.problem.index} updated.`);
        }).catch(error => {
            handleError(error, 'Could not update examples.');
        });
    }

    submitClicked() {
        this.setState({ isSubmitting: true });
        const problemId = this.props.problemId;
        submit(problemId).then(() => {
            // The Codeforces API seems to be slightly delayed.
            // We wait for a second before entering the fast submission checking mode.
            setTimeout(() => {
                if (this.props.problemId === problemId) {
                    this.setState({ isSubmitting: false });
                    this.props.fetchSubmissionsNow();
                }
            }, 1000);
        });
    }

    render() {
        const running = this.props.problem.examples && this.props.problem.examples.some(example => example.killProcess);

        return <div>
            <button className="btn right-button" onClick={this.openTerminal}>Terminal</button>
            <h1>{this.props.problem.siblingPrefix}{this.props.problem.index}{this.props.problem.name && <span> - {this.props.problem.name}</span>}</h1>
            {this.props.skipCompilation?null:(
              <div>
                  <button className="btn right-button" onClick={this.compile}>Compile</button>
                  <CompilationSection compilation={this.props.problem.compilation} />
              </div>
            )}
            <div>
                <button className="btn right-button" onClick={this.runExamples}>Run All</button>
                { running && <button className="btn right-button" onClick={this.killExamples}>Kill All</button> }
                <ExamplesSection examples={this.props.problem.examples}
                    enableChecking={this.props.problem.enableChecking}
                    caseInsensitive={this.props.problem.caseInsensitive}
                    ignoreWhitespace={this.props.problem.ignoreWhitespace}
                    acceptNumericError={this.props.problem.acceptNumericError}
                    problemId={this.props.problemId}
                    downloadExamples={this.downloadExamples} />
            </div>
            { this.props.problem.submissions && <div className="subcont">
                <SubmitButton submit={this.submitClicked} />
                <SubmissionsSection submissions={this.props.problem.submissions} isSubmitting={this.state.isSubmitting} />
            </div> }
        </div>
    }

}
