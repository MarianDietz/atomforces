'use babel';

import React from 'react';
import CollapsableSubsection from './CollapsableSubsection';
import TerminalView from './TerminalView';

// props: compilation
// state: collapsed
export default class CompilationSection extends React.Component {

    constructor(props) {
        super(props);

        this.state = { collapsed: true };
        this.toggleCollapsed = this.toggleCollapsed.bind(this);
    }

    componentDidUpdate(prevProps, prevState) {
        // Collapse if there is no output
        if (!this.state.collapsed && !prevState.collapsed &&
            this.props.compilation.output && this.props.compilation.output.length == 0) {
            this.setState({ collapsed: true });
        }
        // Un-collapse if there is output
        if (this.state.collapsed && prevState.collapsed &&
            this.props.compilation.output && this.props.compilation.output.length > 0 && !this.props.compilation.outdated) {
            this.setState({ collapsed: false });
        }
    }

    toggleCollapsed() {
        this.setState(state => ({ collapsed: !state.collapsed }));
    }

    render() {
        var companion = null;
        if (this.props.compilation.outdated)
            companion = <span className="badge badge-info">Outdated</span>
        else if (this.props.compilation.output != null && this.props.compilation.exitCode == null)
            companion = <span className="loading loading-spinner-tiny inline-block" />
        else if (this.props.compilation.output != null && this.props.compilation.exitCode === 0)
            companion = <span className="badge badge-success">Successful</span>
        else if (this.props.compilation.output != null && this.props.compilation.exitCode !== 0)
            companion = <span className="badge badge-error">Failed</span>

        return <CollapsableSubsection collapsed={this.state.collapsed} toggleCollapsed={this.toggleCollapsed}
                heading={<span><span className="mr-4">Compilation</span> {companion}</span>}>
            { this.props.compilation.output &&
                <TerminalView
                    output={this.props.compilation.output}
                    isFinished={this.props.compilation.exitCode != null} /> }
        </CollapsableSubsection>
    }

}
