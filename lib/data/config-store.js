'use babel';

import EventEmitter from 'events';
import AtomforcesDispatcher from './atomforces-dispatcher';
import template from 'lodash.template';
import { outdateAllCompilations } from './atomforces-actions';

class ConfigStore {

    constructor() {
        this._emitters = new Map();
        this._changes = new Set();
        this.dispatchToken = AtomforcesDispatcher.register(payload => {
            this._invokeOnDispatch(payload);
        });
    }

    addListener(event, callback) {
        if (!this._emitters.has(event)) this._emitters.set(event, new EventEmitter());
        this._emitters.get(event).on('c', callback);
    }

    removeListener(event, callback) {
        this._emitters.get(event).off('c', callback);
    }

    _invokeOnDispatch(payload) {
        this._changes.clear();
        this._onDispatch(payload);
        this._changes.forEach(change => {
            if (this._emitters.has(change)) {
                this._emitters.get(change).emit('c');
            }
        })
    }

    getProgrammingLanguage() {
        return this.programmingLanguage;
    }

    getCompilationCommand() {
        return this.compilationCommand;
    }

    getAutoCompilation() {
        return this.autoCompilation;
    }

    getAutoEvaluation() {
        return this.autoEvaluation;
    }

    getTemplateSnippetPrefix() {
        return this.templateSnippetPrefix;
    }

    getTemplateSnippetScope() {
        return this.templateSnippetScope;
    }

    getFileStructureProblemDirectory() {
        return this.fileStructureProblemDirectory;
    }

    getFileStructureSourceFileName() {
        return this.fileStructureSourceFileName;
    }

    getFileStructureExecutableName() {
        return this.fileStructureExecutableName;
    }

    getFileStructureInputFileName() {
        return this.fileStructureInputFileName;
    }

    getFileStructureInputFileRegex() {
        return this.fileStructureInputFileRegex;
    }

    getFileStructureOutputFileName() {
        return this.fileStructureOutputFileName;
    }

    getFileStructureOutputFileRegex() {
        return this.fileStructureOutputFileRegex;
    }

    _onDispatch(payload) {
        switch (payload.type) {
            case 'SET_PROGRAMMING_LANGUAGE':
                this.programmingLanguage = payload.programmingLanguage;
                this._changes.add('programmingLanguage');
                break;
            case 'SET_COMPILATION_COMMAND':
                this.compilationCommand = template(payload.compilationCommand);
                this._changes.add('compilationCommand');
                break;
            case 'SET_AUTO_COMPILATION':
                this.autoCompilation = payload.autoCompilation;
                this._changes.add('autoCompilation');
                break;
            case 'SET_AUTO_EVALUATION':
                this.autoEvaluation = payload.autoEvaluation;
                this._changes.add('autoEvaluation');
                break;
            case 'SET_TEMPLATE_SNIPPET_PREFIX':
                this.templateSnippetPrefix = payload.templateSnippetPrefix;
                this._changes.add('templateSnippetPrefix');
                break;
            case 'SET_TEMPLATE_SNIPPET_SCOPE':
                this.templateSnippetScope = payload.templateSnippetScope;
                this._changes.add('templateSnippetScope');
                break;
            case 'SET_FILE_STRUCTURE_PROBLEM_DIRECTORY':
                this.fileStructureProblemDirectory = template(payload.fileStructureProblemDirectory);
                this._changes.add('fileStructureProblemDirectory');
                break;
            case 'SET_FILE_STRUCTURE_SOURCE_FILE_NAME':
                this.fileStructureSourceFileName = template(payload.fileStructureSourceFileName);
                this._changes.add('fileStructureSourceFileName');
                break;
            case 'SET_FILE_STRUCTURE_EXECUTABLE_NAME':
                this.fileStructureExecutableName = template(payload.fileStructureExecutableName);
                this._changes.add('fileStructureExecutableName');
                break;
            case 'SET_FILE_STRUCTURE_INPUT_FILE_NAME':
                this.fileStructureInputFileName = template(payload.fileStructureInputFileName);
                this._changes.add('fileStructureInputFileName');
                break;
            case 'SET_FILE_STRUCTURE_INPUT_FILE_REGEX':
                try {
                    this.fileStructureInputFileRegex = new RegExp(payload.fileStructureInputFileRegex);
                    if (this.fileStructureInputFileRegexErrorNotification) {
                        this.fileStructureInputFileRegexErrorNotification.dismiss();
                        this.fileStructureInputFileRegexErrorNotification = null;
                        atom.notifications.addSuccess('Atomforces: Changed input file regex', {
                            detail: payload.fileStructureInputFileRegex
                        });
                    }
                } catch (_) {
                    if (this.fileStructureInputFileRegexErrorNotification) {
                        this.fileStructureInputFileRegexErrorNotification.dismiss();
                    }
                    this.fileStructureInputFileRegexErrorNotification = atom.notifications.addError(
                        'Invalid Input File Regex', {
                            detail: payload.fileStructureInputFileRegex,
                            dismissable: true
                        });
                    this.fileStructureInputFileRegex = new RegExp('^examples/(.*)\\.in$');
                }
                this._changes.add('fileStructureInputFileRegex');
                break;
            case 'SET_FILE_STRUCTURE_OUTPUT_FILE_NAME':
                this.fileStructureOutputFileName = template(payload.fileStructureOutputFileName);
                this._changes.add('fileStructureOutputFileName');
                break;
            case 'SET_FILE_STRUCTURE_OUTPUT_FILE_REGEX':
                try {
                    this.fileStructureOutputFileRegex = new RegExp(payload.fileStructureOutputFileRegex);
                    if (this.fileStructureOutputFileRegexErrorNotification) {
                        this.fileStructureOutputFileRegexErrorNotification.dismiss();
                        this.fileStructureOutputFileRegexErrorNotification = null;
                        atom.notifications.addSuccess('Atomforces: Changed output file regex', {
                            detail: payload.fileStructureOutputFileRegex
                        });
                    }
                } catch (error) {
                    if (this.fileStructureOutputFileRegexErrorNotification) {
                        this.fileStructureOutputFileRegexErrorNotification.dismiss();
                    }
                    this.fileStructureOutputFileRegexErrorNotification = atom.notifications.addError(
                        'Invalid Output File Regex', {
                            detail: payload.fileStructureOutputFileRegex,
                            dismissable: true
                        });
                    this.fileStructureOutputFileRegex = new RegExp('^examples/(.*)\\.in$');
                }
                this._changes.add('fileStructureOutputFileRegex');
                break;
        }
    }

}
export default new ConfigStore();
