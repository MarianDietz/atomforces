'use babel';

import React from 'react';
import ContestStore from '../data/contest-store';
import ProblemSelection from './ProblemSelection';
import withStores from './Container';

class ProblemSelectionContainer extends React.PureComponent {

    render() {
        return <ProblemSelection
                problemIds={this.props.data}
                paths={this.props.paths}
                submissionClicked={this.props.submissionClicked}
                submit={this.props.submit} />
    }

}

export default withStores(
    ProblemSelectionContainer,
    props => [[ContestStore, props.contestId]],
    props => ContestStore.getContests().get(props.contestId).problems,
    { readdListeners: true }
);
