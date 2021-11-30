'use babel';

import React from 'react';
import ExampleDetailsView from './ExampleDetailsView';
import { runExample } from '../business/example-runner';
import { exampleIsBad } from '../utils';

// props: problemId, enableChecking, example
// state: collapsed
export default class ExampleView extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = { collapsed: !exampleIsBad(this.props.example, this.props.enableChecking) }
        this.toggle = this.toggle.bind(this);
        this.run = this.run.bind(this);
        this.kill = this.kill.bind(this);
    }

    componentDidUpdate(prevProps, prevState) {
        if (!this.state.collapsed || !prevState.collapsed) return;
        if (exampleIsBad(this.props.example, this.props.enableChecking)) {
            this.setState({ collapsed: false });
        }
    }

    toggle() {
        this.setState(state => ({ collapsed: !state.collapsed }));
    }

    run() {
        runExample(this.props.problemId, this.props.example.name);
    }

    kill() {
        this.props.example.killProcess();
    }

    render() {
        var companion = null;
        if (this.props.example.outdated)
            companion = <span className="badge badge-info">Outdated</span>
        else if (this.props.example.manuallyKilled)
            companion = <span className="badge badge-error">Killed</span>
        else if (this.props.example.exitCode === -1)
            companion = <span className="badge badge-error">Error</span>
        else if (this.props.example.exitCode != null && this.props.example.exitCode !== 0)
            companion = <span className="badge badge-error">Exited with code {this.props.example.exitCode}</span>
        else if (this.props.example.signal != null)
            companion = <span className="badge badge-error">Killed with signal {this.props.example.signal}</span>
        else if (this.props.example.output != null && this.props.example.exitCode == null)
            companion = <span className="loading loading-spinner-tiny inline-block" />
        else if (this.props.enableChecking && this.props.example.checkingOk)
            companion = <span className="badge badge-success">Correct</span>
        else if (this.props.enableChecking && !this.props.example.checkingOk)
            companion = <span className="badge badge-error">Wrong</span>
        else if (this.props.example.output != null)
            companion = <span className="badge">Executed</span>

        return <li className={"collapsable " + (this.state.collapsed ? 'collapsed' : '')}>
            <button className="btn right-button" onClick={this.run}>Run</button>
            { this.props.example.killProcess && <button className="btn right-button" onClick={this.kill}>Kill</button> }
            <h3 className="collapsable-collapser" onClick={this.toggle}>
                <span style={{marginRight: '1em'}}>Example {this.props.example.name}</span>
                {!this.props.example.producedStderr && companion}
                {this.props.example.producedStderr && <span className="badge badge-warning">stderr</span>}
            </h3>
            { !this.state.collapsed && <ExampleDetailsView example={this.props.example} /> }
        </li>
    }

}
