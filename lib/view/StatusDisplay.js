'use babel';

import React from 'react';

export default class StatusDisplay extends React.PureComponent {

    render() {
        if (this.props.connected) {
            return <span className="inline-block highlight-success status-display">Connected to Codeforces</span>
        } else {
            return <span className="inline-block highlight-error status-display">Codeforces Connection Issues</span>
        }
    }

}
