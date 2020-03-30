'use babel';

import React from 'react';
import ReactDOM from 'react-dom';
import LoginInformationContainer from './LoginInformationContainer';
import PathSelection from './PathSelection';

export default class AtomforcesRoot {

    constructor() {
        this.element = document.createElement('div');
        this.element.classList.add('atomforces-element');
        ReactDOM.render(<div>
            <LoginInformationContainer />
            <div><PathSelection /></div>
        </div>, this.element);
    }

    destroy() {
    }

    getElement() {
        return this.element;
    }

    getTitle() {
        return 'Codeforces';
    }

    getURI() {
        return 'atom://atomforces';
    }

    getDefaultLocation() {
        return 'right';
    }

    getAllowedLocations() {
        return ['left', 'right'];
    }

}
