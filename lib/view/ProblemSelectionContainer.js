'use babel';

import React from 'react';
import ContestStore from '../data/contest-store';
import ConfigStore from '../data/config-store';
import ProblemSelection from './ProblemSelection';
import withStores from './Container';

class ProblemSelectionContainer extends React.PureComponent {

    render() {
        return <ProblemSelection
                problemIds={this.props.data.problemIds}
                fileStructureProblemDirectory={this.props.data.fileStructureProblemDirectory}
                paths={this.props.paths}
                fetchSubmissionsNow={this.props.fetchSubmissionsNow} />
    }

}

export default withStores(
    ProblemSelectionContainer,
    props => [[ContestStore, props.contestId], [ConfigStore, 'fileStructureProblemDirectory']],
    props => { return {
        problemIds: ContestStore.getContests().get(props.contestId).problems,
        fileStructureProblemDirectory: ConfigStore.getFileStructureProblemDirectory()
    } },
    { readdListeners: true }
);
