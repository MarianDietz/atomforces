'use babel';

import React from 'react';
import IndicativeSubmissionContainer from './IndicativeSubmissionContainer';
import Countdown from './Countdown';

// props: contest
export default class ContestView extends React.Component {

    render() {
        return <div>
            <button className="btn right-button" onClick={this.props.refreshClicked}>Refresh</button>
            <h1><span style={{ marginRight: '1em' }}>{this.props.contest.name}</span></h1>
            { this.props.contest.phase === 'BEFORE' && <Countdown startTime={this.props.contest.localStartTime} />}
            { this.props.contest.problems && <div>
                <div className="link"><a onClick={this.props.prepareDirectory}>Prepare Directory & Open all Problems</a></div>
                <table className="table">
                    <colgroup>
                        <col />
                        <col />
                        <col style={{width: '6em'}} />
                        <col style={{width: '6em'}} />
                    </colgroup>
                    <tbody>
                        { this.props.contest.problems.map(problem =>
                            <IndicativeSubmissionContainer problemId={problem.id} key={problem.id} />
                        ) }
                    </tbody>
                </table>
            </div> }
        </div>
    }

}
