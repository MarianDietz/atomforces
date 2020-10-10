'use babel';

import React from 'react';
import ContestSelection from './ContestSelection';
import ContestStore from '../data/contest-store';
import ProblemStore from '../data/problem-store';
import withStores from './Container';

class ContestSelectionContainer extends React.Component {

    render() {
        return <ContestSelection paths={this.props.paths} contestPathToIdMap={this.props.data.contests} problemPathToIdMap={this.props.data.problems} />
    }

}

export default withStores(
    ContestSelectionContainer,
    () => [[ContestStore, 'list'], [ProblemStore, 'list']],
    props => {
        return {
            contests: ContestStore.getPathToIdMap(),
            problems: ProblemStore.getStandalonePathToIdMap()
        }
    },
    { readdListeners: false }
);
