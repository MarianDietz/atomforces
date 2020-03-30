'use babel';

import React from 'react';
import IndicativeSubmissionContainer from './IndicativeSubmissionContainer';
import Countdown from './Countdown';

// props: contest
export default class ContestView extends React.Component {

    render() {
        return <div>
            <button className="btn right-button" onClick={this.props.refreshClicked}>Refresh</button>
            <h1><span style={{ marginRight: '1em' }}>{this.props.contest.name}</span>
                { this.props.isSubmitting && <span className="loading loading-spinner-small inline-block" />}</h1>
            { this.props.contest.phase === 'BEFORE' && <Countdown startTime={this.props.contest.localStartTime} />}
            <table className="table">
                <colgroup>
                    <col />
                    <col />
                    <col style={{width: '6em'}} />
                    <col style={{width: '6em'}} />
                </colgroup>
                <tbody>
                    {this.props.contest.problems && Array.from(this.props.contest.problems.values()).map(problemId =>
                        <IndicativeSubmissionContainer problemId={problemId} key={problemId} />
                    )}
                </tbody>
            </table>
        </div>
    }

}
