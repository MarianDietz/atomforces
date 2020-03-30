'use babel';

import React from 'react';
import SubmissionRow from './SubmissionRow';
import SubmissionStore from '../data/submission-store';
import withStores from './Container';

class SubmissionContainer extends React.PureComponent {

    render() {
        if (this.props.data == null) return null;
        else return <SubmissionRow submission={this.props.data} submissionClicked={this.props.submissionClicked} />
    }

}

export default withStores(
    SubmissionContainer,
    props => [[SubmissionStore, props.submissionId]],
    props => SubmissionStore.getSubmissions().get(props.submissionId),
    { readdListeners: true }
);
