'use babel';

import React from 'react';
import SubmissionsSection from './SubmissionsSection';
import CompilationSection from './CompilationSection';
import ExamplesSection from './ExamplesSection';
import SubmitButton from './SubmitButton';
import compile from '../business/compiler';
import { loadExamplesSync, downloadExamples } from '../business/example-updater';
import { runAllExamples } from '../business/example-runner';
import { handleError } from '../utils';

export default class ProblemView extends React.Component {

    constructor(props) {
        super(props);

        this.compile = this.compile.bind(this);
        this.runExamples = this.runExamples.bind(this);
        this.killExamples = this.killExamples.bind(this);
        this.openTerminal = this.openTerminal.bind(this);
        this.downloadExamples = this.downloadExamples.bind(this);
    }

    componentDidMount() {
        this.loadExamples();
    }

    componentDidUpdate() {
        this.loadExamples();
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

    render() {
        const running = this.props.problem.examples && this.props.problem.examples.some(example => example.killProcess);

        return <div>
            <button className="btn right-button" onClick={this.openTerminal}>Terminal</button>
            <h1>{this.props.problem.index}{this.props.problem.name && <span> - {this.props.problem.name}</span>}</h1>
            <div>
                <button className="btn right-button" onClick={this.compile}>Compile</button>
                <CompilationSection compilation={this.props.problem.compilation} />
            </div>
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
            { this.props.problem.submissions && <div>
                <SubmitButton submit={() => this.props.submit(this.props.problemId)} />
                <SubmissionsSection
                    submissions={this.props.problem.submissions}
                    submissionClicked={this.props.submissionClicked} />
            </div> }
        </div>
    }

}
