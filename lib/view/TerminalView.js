'use babel';

import React from 'react';
import { CompositeDisposable } from 'atom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
const ThemeMatcher = require(atom.packages.resolvePackagePath('terminal-tab') + '/lib/theme-matcher');
import { TextEditor } from 'atom';

// props: output (array of strings, make sure to not make it immutable), isFinished
export default class TerminalView extends React.Component {

    constructor(props) {
        super(props);

        this.containerRef = React.createRef();
        this.disposables = new CompositeDisposable();
        this.fitAddon = new FitAddon();
        this.state = { written: 0, usedOutput: null };
    }

    componentDidMount() {
        this.xterm = new Terminal();
        this.xterm.open(this.containerRef.current);
        this.xterm.loadAddon(this.fitAddon);
        this.props.output.forEach(s => this.xterm.write(s));
        if (this.props.isFinished) this.scrollToTop();

        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.containerRef.current);

        this.observeAndApplyThemeStyles();
        this.observeAndApplyTypeSettings();
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState(state => {
            if (state.usedOutput !== nextProps.output) {
                this.xterm.clear();
                nextProps.output.forEach(s => this.xterm.write(s));
                if (nextProps.isFinished) this.scrollToTop();
                return { written: nextProps.output.length, usedOutput: nextProps.output };
            } else {
                for (var i = state.written; i < nextProps.output.length; i++) {
                    this.xterm.write(nextProps.output[i]);
                }
                if (nextProps.isFinished) this.scrollToTop();
                return { written: nextProps.output.length };
            }
        });
    }

    scrollToTop() {
        setTimeout(() => {
            if (this.xterm) this.xterm.scrollToTop();
        }, 0);
    }

    shouldComponentUpdate() {
        return false;
    }

    componentWillUnmount() {
        this.disposables.dispose();
        this.resizeObserver.disconnect();
        this.xterm.dispose();
    }

    render() {
        return <div ref={this.containerRef} />
    }

    resize() {
        try { this.fitAddon.fit() } catch(_) { }
    }

    /**
    * The following code has been copied (and adjusted) from https://github.com/jsmecham/atom-terminal-tab/blob/master/lib/terminal-view.js
    */

    //
    // Observe for changes to the matchTheme configuration directive and apply
    // the styles when the value changes. This will also apply them when called
    // for the first time.
    //
    observeAndApplyThemeStyles() {
        if (this.isObservingThemeSettings) return;
        this.disposables.add(atom.config.onDidChange('terminal-tab.matchTheme', this.applyThemeStyles.bind(this)));
        this.disposables.add(atom.themes.onDidChangeActiveThemes(this.applyThemeStyles.bind(this)));
        this.isObservingThemeSettings = true;
        this.applyThemeStyles();
    }

    //
    // Observe for changes to the Editor configuration for Atom and apply
    // the type settings when the values we are interested in change. This
    // will also apply them when called for the first time.
    //
    observeAndApplyTypeSettings() {
        if (this.isObservingTypeSettings) return;
        this.disposables.add(atom.config.onDidChange('terminal-tab.fontFamily', this.applyTypeSettings.bind(this)));
        this.disposables.add(atom.config.onDidChange('editor.fontFamily', this.applyTypeSettings.bind(this)));
        this.disposables.add(atom.config.onDidChange('editor.fontSize', this.applyTypeSettings.bind(this)));
        this.disposables.add(atom.config.onDidChange('editor.lineHeight', this.applyTypeSettings.bind(this)));
        this.isObservingTypeSettings = true;
        this.applyTypeSettings();
    }

    //
    // Attempts to match the Xterm instance with the current Atom theme colors.
    //
    // TODO: This should take advantage of update()
    // TODO: This doesn't undo the font settings when the theme is disabled...
    //
    applyThemeStyles() {

        // Bail out if the user has not requested to match the theme styles
        if (!atom.config.get('terminal-tab.matchTheme')) {
            this.xterm.setOption('theme', {});
            return;
        }

        // Parse the Atom theme styles and configure the Xterm to match.
        const themeStyles = ThemeMatcher.parseThemeStyles();
        this.xterm.setOption('theme', themeStyles);

    }

    //
    // Attempts to match the Atom type settings (font family, size and line height) with
    // Xterm.
    //
    applyTypeSettings() {

        //
        // Set the font family in Xterm to match Atom.
        //
        const fontFamily = atom.config.get('terminal-tab.fontFamily')
        || atom.config.get('editor.fontFamily')
        || 'Menlo, Consolas, "DejaVu Sans Mono", monospace'; // Atom default (as of 1.25.0)
        this.xterm.setOption('fontFamily', fontFamily);

        //
        // Set the font size in Xterm to match Atom.
        //
        const fontSize = atom.config.get('editor.fontSize');
        this.xterm.setOption('fontSize', fontSize);

        //
        // Set the line height in Xterm to match Atom.
        //
        // TODO: This is disabled, because the line height as specified in
        //       Atom is not the same as what Xterm is using to render its
        //       lines (i.e. 1.5 in Atom is more like 2x in Xterm). Need to
        //       figure out the correct conversion or fix the bug, if there
        //       is one.
        //
        // const lineHeight = atom.config.get('editor.lineHeight');
        // this.session.xterm.setOption('lineHeight', lineHeight);

        //
        // Changing the font size and/or line height requires that we
        // recalcuate the size of the Xterm instance.
        //
        // TODO: Call the renamed method (i.e. resizeTerminalToFitContainer())
        //
        this.resize();

    }

}
