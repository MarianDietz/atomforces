'use babel';

import React from 'react';
import ContestStore from '../data/contest-store';
import ContestContainer from './ContestContainer';
import ProblemSelectionContainer from './ProblemSelectionContainer';
import ContestUpdater from '../business/contest-updater';
import CodeforcesScraper from '../business/codeforces-scraper';
import { prepareContestDirectory } from '../business/directory-preparer';
import { downloadAllExamples } from '../business/example-updater';

// props: contestId, paths
// isSubmitting
export default class ContestProblemView extends React.Component {

    constructor(props) {
        super(props);

        this.refresh = this.refresh.bind(this);
        this.prepareDirectory = this.prepareDirectory.bind(this);
        this.fetchSubmissionsNow = this.fetchSubmissionsNow.bind(this);
    }

    componentDidMount() {
        this.contestUpdater = new ContestUpdater(this.props.contestId);
        this.contestUpdater.start();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.contestId == this.props.contestId) return;
        this.contestUpdater.stop();
        this.contestUpdater = new ContestUpdater(this.props.contestId);
        this.contestUpdater.start();
    }

    componentWillUnmount() {
        this.contestUpdater.stop();
        this.contestUpdater = null;
    }

    refresh() {
        CodeforcesScraper.repeatedNetworkErrors = 0;
        this.contestUpdater.executeNow();
    }

    prepareDirectory() {
        prepareContestDirectory(this.props.contestId);
        downloadAllExamples(this.props.contestId, true);
    }

    fetchSubmissionsNow() {
        if (this.contestUpdater) {
            this.contestUpdater.fetchSubmissionsNow();
        }
    }

    render() {
        return <div>
            <ContestContainer contestId={this.props.contestId} refreshClicked={this.refresh} prepareDirectory={this.prepareDirectory} />
            <ProblemSelectionContainer
                contestId={this.props.contestId}
                paths={this.props.paths}
                fetchSubmissionsNow={this.fetchSubmissionsNow} />
        </div>
    }

}
