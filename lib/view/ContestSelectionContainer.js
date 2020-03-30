'use babel';

import React from 'react';
import ContestSelection from './ContestSelection';
import ContestStore from '../data/contest-store';
import withStores from './Container';

class ContestSelectionContainer extends React.Component {

    render() {
        return <ContestSelection paths={this.props.paths} contestPathToIdMap={this.props.data} />
    }

}

export default withStores(
    ContestSelectionContainer,
    () => [[ContestStore, 'list']],
    props => ContestStore.getPathToIdMap(),
    { readdListeners: false }
);
