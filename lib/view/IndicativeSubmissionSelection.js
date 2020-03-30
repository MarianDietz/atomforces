'use babel';

import React from 'react';
import IndicativeSubmissionRow from './IndicativeSubmissionRow';

export default class IndicativeSubmissionSelection extends React.Component {

    render() {
        var submission = this.props.submissions.find(submission => submission.verdict === 'OK');
        if (!submission && this.props.submissions.length > 0) submission = this.props.submissions[0];

        return <IndicativeSubmissionRow problem={this.props.problem} submission={submission} />
    }

}
