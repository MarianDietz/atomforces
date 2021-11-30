'use babel';

import React from 'react';
import CollapsableSubsection from './CollapsableSubsection';
import ExampleView from './ExampleView';
import { updateProblem } from '../data/atomforces-actions';
import { exampleIsBad } from '../utils';

// props: problemId, examples, enableChecking, caseInsensitive, ignoreWhitespace, acceptNumericError, downloadExamples
// state: collapsed
export default class ExamplesSection extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = { collapsed: true };
        this.checkboxChange = this.checkboxChange.bind(this);
        this.toggleCollapsed = this.toggleCollapsed.bind(this);
    }

    checkboxChange(event) {
        const name = event.target.name;
        const value = event.target.checked;
        updateProblem(this.props.problemId, { [name]: value });
    }

    toggleCollapsed() {
        this.setState(state => ({ collapsed: !state.collapsed }));
    }

    componentDidUpdate(prevProps, prevState) {
        if (!this.state.collapsed || !prevState.collapsed || !this.props.examples) return;
        const open = this.props.examples.some(example =>
            exampleIsBad(example, this.props.enableChecking));
        if (open) this.setState({ collapsed: false });
    }

    render() {
        if (this.props.examples == null) return null;

        // 0 - execution error
        // 1 - wrong result / non-zero exit code / signaled
        // 2 - outdated
        // 3 - killed
        // 4 - running
        // 5 - executed without checking
        // 6 - correct
        const level = this.props.examples.map(example => {
            if (example.outdated) return 2;
            else if (example.manuallyKilled) return 3;
            else if (example.exitCode === -1) return 0;
            else if (example.exitCode != null && example.exitCode !== 0) return 1;
            else if (example.signal != null) return 1;
            else if (example.output != null && example.exitCode == null) return 4;
            else if (this.props.enableChecking && example.checkingOk) return 6;
            else if (this.props.enableChecking && !example.checkingOk) return 1;
            else if (example.output != null) return 5;
            else return 7;
        }).reduce((a, b) => Math.min(a, b), 7);

        var companion = null;
        if (level === 0) companion = <span className="badge badge-error">Error</span>
        else if (level === 1) companion = <span className="badge badge-error">Wrong</span>
        else if (level === 2) companion = <span className="badge badge-info">Outdated</span>
        else if (level === 3) companion = <span className="badge badge-error">Killed</span>
        else if (level === 4) companion = <span className="loading loading-spinner-tiny inline-block" />
        else if (level === 5) companion = <span className="badge">Executed</span>
        else if (level === 6) companion = <span className="badge badge-success">Correct</span>

        const producedStderr = this.props.examples.some(example => example.producedStderr);

        return <CollapsableSubsection collapsed={this.state.collapsed} toggleCollapsed={this.toggleCollapsed}
                heading={<span><span style={{marginRight: '1em'}}>Examples</span>{!producedStderr && companion}
                {producedStderr && <span className="badge badge-warning">stderr</span>}</span>}>
            <div className="examples-container">
                <label className="input-label checking-mode-checkbox">
                    <input name="enableChecking"
                        checked={this.props.enableChecking}
                        type="checkbox"
                        className="input-checkbox"
                        onChange={this.checkboxChange} />
                    Enable Checking
                </label>
                { this.props.enableChecking &&
                    <label className="input-label checking-mode-checkbox">
                        <input name="caseInsensitive"
                            checked={this.props.caseInsensitive}
                            type="checkbox"
                            className="input-checkbox"
                            onChange={this.checkboxChange} />
                        Case Insensitive
                    </label> }
                { this.props.enableChecking &&
                    <label className="input-label checking-mode-checkbox">
                        <input name="ignoreWhitespace"
                            checked={this.props.ignoreWhitespace}
                            type="checkbox"
                            className="input-checkbox"
                            onChange={this.checkboxChange} />
                        Ignore Whitespace
                    </label> }
                { this.props.enableChecking &&
                    <label className="input-label checking-mode-checkbox">
                        <input name="acceptNumericError"
                            checked={this.props.acceptNumericError}
                            type="checkbox"
                            className="input-checkbox"
                            onChange={this.checkboxChange} />
                        Accept Numerical Error
                    </label> }
                <div className="link"><a onClick={this.props.downloadExamples}>Update Examples from Codeforces</a></div>
                <ul className="samples-list">
                    {this.props.examples.map(example =>
                        <ExampleView example={example} enableChecking={this.props.enableChecking} problemId={this.props.problemId} key={example.name} />
                    )}
                </ul>
            </div>
        </CollapsableSubsection>
    }

}
