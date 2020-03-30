'use babel';

import React from 'react';

// props: collapsed, toggleCollapsed
export default class CollapsableSubsection extends React.Component {

    render() {
        return <section className={"subsection collapsable " + (this.props.collapsed ? 'collapsed' : '')}>
            <h2 className="subsection-heading collapsable-collapser" onClick={this.props.toggleCollapsed}>{this.props.heading}</h2>
            { !this.props.collapsed && <div className="subsection-body collapsable-body">{this.props.children}</div> }
        </section>
    }

}
