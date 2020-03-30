'use babel';

import React from 'react';
import open from 'open';
import ContestStore from '../data/contest-store';
import ContestContainer from './ContestContainer';
import ProblemSelectionContainer from './ProblemSelectionContainer';
import ContestUpdater from '../business/contest-updater';
import CodeforcesScraper from '../business/codeforces-scraper';
import submit from '../business/submitter';

// props: contestId, paths
// isSubmitting
export default class ContestProblemView extends React.Component {

    constructor(props) {
        super(props);

        this.state = { isSubmitting: false };
        this.openSubmission = this.openSubmission.bind(this);
        this.refresh = this.refresh.bind(this);
        this.submitClicked = this.submitClicked.bind(this);
    }

    componentDidMount() {
        this.contestUpdater = new ContestUpdater(this.props.contestId);
        this.contestUpdater.start();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.contestId == this.props.contestId) return;
        this.setState({ isSubmitting: false });
        this.contestUpdater.stop();
        this.contestUpdater = new ContestUpdater(this.props.contestId);
        this.contestUpdater.start();
    }

    componentWillUnmount() {
        this.contestUpdater.stop();
        this.contestUpdater = null;
    }

    openSubmission(submissionId) {
        const contest = ContestStore.getContests().get(this.props.contestId);
        if (!contest) return;
        open(`https://codeforces.com/contest/${contest.codeforcesId}/submission/${submissionId}`);
    }

    refresh() {
        CodeforcesScraper.repeatedNetworkErrors = 0;
        this.contestUpdater.executeNow();
    }

    submitClicked(problemId) {
        const contestId = this.props.contestId;
        this.setState({ isSubmitting: true });
        submit(contestId, problemId).then(() => {
            // The Codeforces API seems to be slightly delayed.
            // We wait for a second before entering the fast submission checking mode.
            setTimeout(() => {
                if (this.contestUpdater && this.contestUpdater.contestId === contestId) {
                    this.setState({ isSubmitting: false });
                    this.contestUpdater.startFastSubmissionCheckingMode();
                }
            }, 1000);
        });
    }

    render() {
        return <div>
            <ContestContainer contestId={this.props.contestId} refreshClicked={this.refresh} isSubmitting={this.state.isSubmitting} />
            <ProblemSelectionContainer
                contestId={this.props.contestId}
                paths={this.props.paths}
                submissionClicked={this.openSubmission}
                submit={this.submitClicked} />
        </div>
    }

}
