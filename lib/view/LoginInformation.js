'use babel';

import React from 'react';
import { updateLogin, ensureLogin, logout } from '../business/login-updater';

// props: loggedIn, handle
export default class LoginInformation extends React.Component {

    constructor(props) {
        super(props);

        this.logoutClicked = this.logoutClicked.bind(this);
        this.loginClicked = this.loginClicked.bind(this);
    }

    componentDidMount() {
        updateLogin();
    }

    loginClicked() {
        ensureLogin();
    }

    logoutClicked() {
        logout();
    }

    render() {
        if (this.props.loggedIn) {
            return <div class="login-message">Logged in as {this.props.handle}. <a onClick={this.logoutClicked}>Logout</a></div>
        } else {
            return <div class="login-message">Not logged in. <a onClick={this.loginClicked}>Login</a></div>
        }
    }

}
