'use babel';

import React from 'react';
import ContestView from './ContestView';
import ContestStore from '../data/contest-store';
import LoginStore from '../data/login-store';
import withStores from './Container';

class ContestContainer extends React.PureComponent {

    render() {
        if (this.props.data == null) return null;
        var standing = LoginStore.getData().standing;
        return <ContestView standing={standing} contest={this.props.data}
                  refreshClicked={this.props.refreshClicked}
                  refreshStandings={this.props.refreshStandings}
                  prepareDirectory={this.props.prepareDirectory} />
    }

}

export default withStores(
    ContestContainer,
    props => [[ContestStore, props.contestId]],
    props => ContestStore.getContests().get(props.contestId),
    { readdListeners: true }
);
