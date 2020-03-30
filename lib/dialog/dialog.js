'use babel';

import { TextEditor, CompositeDisposable, Disposable } from 'atom';
import PasswordTextField from './password-text-field';

export default class Dialog {

    constructor({ promptText, onConfirm, onCancel, checkInput, isPassword = false }) {
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
        this.checkInput = checkInput;
        this.disposables = new CompositeDisposable();

        this.textField = isPassword ? new PasswordTextField() : new TextEditor({ mini: true });

        this.element = document.createElement('div');
        this.element.classList.add('atomforces-dialog');
        this.valueChanged();

        this.textElement = document.createElement('label');
        this.textElement.textContent = promptText;
        this.element.appendChild(this.textElement);

        this.disposables.add(this.textField.onDidChange(() => this.valueChanged()));
        this.element.appendChild(this.textField.element);

        const blurHandler = () => this.cancel();
        this.textField.element.addEventListener('blur', blurHandler);
        this.disposables.add(new Disposable(() => this.textField.element.removeEventListener('blur', blurHandler)));

        atom.commands.add(this.element, {
            'core:confirm': () => this.processConfirm(),
            'core:cancel': () => this.cancel()
        })
    }

    attach() {
        this.panel = atom.workspace.addModalPanel({ item: this });
        this.textField.element.focus();
        this.textField.scrollToCursorPosition();
    }

    cancel() {
        if (this.onCancel) this.onCancel();
        this.close();
    }

    close() {
        this.panel.destroy();
        this.textField.destroy();
        this.disposables.dispose();
    }

    processConfirm() {
        if (this.valueIsOk()) {
            this.onConfirm(this.textField.getText());
        }
    }

    valueChanged() {
        if (this.valueIsOk()) {
            this.element.classList.add('has-result');
            this.element.classList.remove('has-no-result');
        } else {
            this.element.classList.remove('has-result');
            this.element.classList.add('has-no-result');
        }
    }

    valueIsOk() {
        return this.checkInput(this.textField.getText());
    }

}
