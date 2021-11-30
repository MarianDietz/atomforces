'use babel';

import React from 'react';
import ProblemView from './ProblemView';
import ProblemStore from '../data/problem-store';
import withStores from './Container';
import ConfigStore from '../data/config-store';

class ProblemContainer extends React.PureComponent {

    render() {
        if (this.props.data == null){
          return null;
        }else{
          var skipCompilation = ConfigStore.getSkipCompilation()
          return <ProblemView
                          problemId={this.props.problemId}
                          problem={this.props.data}
                          skipCompilation={skipCompilation}
                          fetchSubmissionsNow={this.props.fetchSubmissionsNow} />
        }
    }

}

export default withStores(
    ProblemContainer,
    props => [[ProblemStore, props.problemId]],
    props => ProblemStore.getProblems().get(props.problemId),
    { readdListeners: true }
);
