'use babel';

import React from 'react';
import ProblemStore from '../data/problem-store';
import SubmissionStore from '../data/submission-store';
import IndicativeSubmissionSelection from './IndicativeSubmissionSelection';
import withStores from './Container';

class IndicativeSubmissionContainer extends React.Component {

    render() {
        return <IndicativeSubmissionSelection problem={this.props.problem} submissions={this.props.data} />
    }

}

const BoundedIndicativeSubmissionContainer = withStores(
    IndicativeSubmissionContainer,
    props => props.problem.submissions.map(submissionId => [SubmissionStore, submissionId]),
    props => props.problem.submissions
        .map(submissionId => SubmissionStore.getSubmissions().get(submissionId))
        .filter(submission => submission != null),
    { readdListeners: true }
)

class IndicativeSubmissionContainerContainer extends React.Component {

    render() {
        if (this.props.data == null) return null;
        return <BoundedIndicativeSubmissionContainer problem={this.props.data} />
    }

}

export default withStores(
    IndicativeSubmissionContainerContainer,
    props => [[ProblemStore, props.problemId]],
    props => ProblemStore.getProblems().get(props.problemId),
    { readdListeners: true }
);
