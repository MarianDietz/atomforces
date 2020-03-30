'use babel';

import { Disposable } from 'atom';

export default class PasswordTextField {

    constructor() {
        this.listeners = [];

        this.element = document.createElement('input');
        this.element.classList.add('input-text', 'native-key-bindings');
        this.element.setAttribute('type', 'password');
        this.element.addEventListener('input', () => {
            this.listeners.forEach(listener => listener());
        });
        this.element.addEventListener('keydown', event => {
            if (event.which === 13) {
                atom.commands.dispatch(this.element, 'core:confirm');
            }
        });
    }

    destroy() {
    }

    getText() {
        return this.element.value;
    }

    onDidChange(listener) {
        this.listeners.push(listener);
        return new Disposable(() => {
            this.listeners.filter(l => l !== listener);
        });
    }

    scrollToCursorPosition() {
    }

}
