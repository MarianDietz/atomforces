'use babel';

import React from 'react';
import { CompositeDisposable } from 'atom';
import ContestSelectionContainer from './ContestSelectionContainer';
import atomforces from '../atomforces';
import { arraysEqual } from '../utils';

// state: editorIsActive, treeViewIsActive, activeTextEditorPath, treeViewPaths
export default class PathSelection extends React.Component {

    constructor(props) {
        super(props);

        const activePane = atom.workspace.getActivePane();
        const activeTextEditor = atom.workspace.getActiveTextEditor();
        this.state = {
            editorIsActive: activePane && this.isTextEditor(activePane),
            treeViewIsActive: activePane && this.isTreeView(activePane),
            activeTextEditorPath: activeTextEditor == null ? null : activeTextEditor.getPath(),
            treeViewPaths: atomforces.getTreeView().selectedPaths()
        };
    }

    isTextEditor(pane) {
        return atom.workspace.isTextEditor(pane);
    }

    isTreeView(pane) {
        return pane.constructor && pane.constructor.name === 'TreeView'
    }

    componentDidMount() {
        this.treeViewPaths = null;

        this.disposables = new CompositeDisposable();
        this.disposables.add(atom.workspace.observeActivePaneItem(activePane => {
            var editorIsActive = false;
            var treeViewIsActive = false;

            if (activePane) {
                if (this.isTextEditor(activePane)) editorIsActive = true;
                if (this.isTreeView(activePane)) treeViewIsActive = true;
            }

            this.setState({ treeViewPaths: atomforces.getTreeView().selectedPaths() });
            this.setState({ editorIsActive, treeViewIsActive });
        }));
        this.disposables.add(atom.workspace.observeActiveTextEditor(editor => {
            this.setState({ treeViewPaths: atomforces.getTreeView().selectedPaths() });
            if (editor) this.setState({ activeTextEditorPath: editor.getPath() });
            else this.setState({ activeTextEditorPath: null });
        }));

        this.treeViewUpdateTimer = setInterval(() => {
            this.setState({ treeViewPaths: atomforces.getTreeView().selectedPaths() });
        }, 500);
    }

    componentWillUnmount() {
        this.disposables.dispose();
        clearInterval(this.treeViewUpdateTimer);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.state.editorIsActive !== nextState.editorIsActive ||
            this.state.treeViewIsActive !== nextState.treeViewIsActive ||
            this.state.activeTextEditorPath !== nextState.activeTextEditorPath ||
            !arraysEqual(this.state.treeViewPaths, nextState.treeViewPaths);
    }

    render() {
        const paths = [
            this.state.editorIsActive && this.state.activeTextEditorPath != null ? [ this.state.activeTextEditorPath ] : [],
            this.state.treeViewIsActive && this.state.treeViewPaths != null ? this.state.treeViewPaths : [],
            this.state.activeTextEditorPath != null ? [ this.state.activeTextEditorPath ] : [],
            this.state.treeViewPaths != null ? this.state.treeViewPaths : []
        ];
        return <ContestSelectionContainer paths={paths} />;
    }

}
