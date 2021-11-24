'use babel';

import React from 'react';
import { updateLogin, ensureLogin, logout } from '../business/login-updater';
import * as defaultData from './data.json'

// props: loggedIn, handle
export default class LoginInformation extends React.PureComponent {

    constructor(props) {
        super(props);

        this.logoutClicked = this.logoutClicked.bind(this);
        this.loginClicked = this.loginClicked.bind(this);
        this.avatar = this.props.avatar || defaultData.avatar
    }

    componentDidMount() {
        updateLogin();
    }

    componentDidUpdate(oldProps) {
        if (oldProps.handle !== this.props.handle) {
            updateLogin();
        }
    }

    loginClicked() {
        ensureLogin();
    }

    logoutClicked() {
        logout();
    }

    render() {
        if (this.props.loggedIn) {
            return(
              <div className="login-message">
                <div className="profile">
                  <img src={this.avatar} alt=""/>
                  <div className={`handle ${this.props.rank}`}>{this.props.handle}</div>
                </div>
                <a onClick={this.logoutClicked}>Logout</a>
              </div>
            )
        } else {
            return(
              <div className="login-message">
                <div className="profile"></div>
                <div>Not logged in. <a onClick={this.loginClicked}>Login</a></div>
              </div>
            )
        }
    }

}
