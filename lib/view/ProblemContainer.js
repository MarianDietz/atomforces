'use babel';

import React from 'react';
import ProblemView from './ProblemView';
import ProblemStore from '../data/problem-store';
import withStores from './Container';

class ProblemContainer extends React.PureComponent {

    render() {
        if (this.props.data == null) return null;
        else return <ProblemView
                        problemId={this.props.problemId}
                        problem={this.props.data}
                        fetchSubmissionsNow={this.props.fetchSubmissionsNow} />
    }

}

export default withStores(
    ProblemContainer,
    props => [[ProblemStore, props.problemId]],
    props => ProblemStore.getProblems().get(props.problemId),
    { readdListeners: true }
);
