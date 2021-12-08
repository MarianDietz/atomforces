'use babel';

import React from 'react';
import { TextEditor } from 'atom';

// props: title, text
export default class ExampleColumn extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = { collapsed: props.collapse };
        this.toggleCollapsed = this.toggleCollapsed.bind(this);
    }

    componentWillUnmount() {
        // this.changeObserver.dispose();
    }

    toggleCollapsed() {
        if(this.props.collapse!=null){
            this.setState(state => ({ collapsed: !state.collapsed }));
        }
    }

    componentDidMount() {
        // this.updateText();
    }

    componentDidUpdate() {
        // this.updateText();
    }

    render() {
        return <div className="editor-column">
            <div>{this.props.title}</div>
            <pre data-collapsed={this.state.collapsed} onClick={this.toggleCollapsed}>
              {this.props.text}
            </pre>
        </div>
    }

}
