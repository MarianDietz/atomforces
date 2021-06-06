'use babel';

import React from 'react';
import ContestView from './ContestView';
import ContestStore from '../data/contest-store';
import withStores from './Container';

class ContestContainer extends React.PureComponent {

    render() {
        if (this.props.data == null) return null;
        return <ContestView contest={this.props.data} refreshClicked={this.props.refreshClicked} prepareDirectory={this.props.prepareDirectory} />
    }

}

export default withStores(
    ContestContainer,
    props => [[ContestStore, props.contestId]],
    props => ContestStore.getContests().get(props.contestId),
    { readdListeners: true }
);
