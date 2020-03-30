'use babel';

import React from 'react';
import { secondsToCountdownString } from '../utils';

export default class Countdown extends React.Component {

    constructor(props) {
        super(props);

        this.state = { remainingSeconds: this.calculateSeconds() };
    }

    componentDidMount() {
        this.timer = setInterval(() => {
            this.setState({ remainingSeconds: this.calculateSeconds() });
        }, 1000);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    calculateSeconds() {
        if (this.props.startTime) {
            var seconds = Math.floor((this.props.startTime - Date.now()) / 1000);
            if (seconds < 0) seconds = 0;
            return seconds;
        } else return null;
    }

    render() {
        return <div className="atomforces-countdown">
            {this.state.remainingSeconds ? secondsToCountdownString(this.state.remainingSeconds, 1) : '--:--'}
        </div>
    }

}
