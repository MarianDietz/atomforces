'use babel';

import React from 'react';
import { TextEditor } from 'atom';

// props: title, text
export default class ExampleColumn extends React.PureComponent {

    constructor(props) {
        super(props);

        this.editorRef = React.createRef();
        this.editor = new TextEditor({
            readonly: true,
            keyboardInputEnabled: false,
            showLineNumbers: false
        });

        this.changeObserver = this.editor.onDidChange(() => {
            if (this.editor.getText() !== (this.props.text || '')) {
                this.editor.setText(this.props.text || '');
            }
        })
    }

    componentWillUnmount() {
        this.changeObserver.dispose();
    }

    componentDidMount() {
        this.updateText();
    }

    componentDidUpdate() {
        this.updateText();
    }

    updateText() {
        this.editorRef.current.appendChild(this.editor.getElement());
        this.editor.setText(this.props.text || '');
        this.editor.setCursorBufferPosition([0, 0]);
    }

    render() {
        return <div className="editor-column">
            <div>{this.props.title}</div>
            <div ref={this.editorRef} />
        </div>
    }

}
