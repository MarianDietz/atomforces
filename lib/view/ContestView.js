'use babel';

import React from 'react';
import opn from 'opn';
import IndicativeSubmissionContainer from './IndicativeSubmissionContainer';
import Countdown from './Countdown';

// props: contest
export default class ContestView extends React.Component {

    constructor(props) {
        super(props);

        this.openProblemset = this.openProblemset.bind(this);
    }

    openProblemset() {
        opn(`https://codeforces.com/contest/${this.props.contest.codeforcesId}/problems`);
    }

    render() {
        return <div>
            <button className="btn right-button" onClick={this.props.refreshClicked}>Refresh</button>
            <h1><span onClick={this.openProblemset} className="contestName mr-4 c-point">{this.props.contest.name}</span></h1>
            { this.props.contest.phase === 'BEFORE' && <Countdown startTime={this.props.contest.localStartTime} />}
            { this.props.contest.problems && <div>
                <div className="link">
                  <a onClick={this.props.prepareDirectory}>Prepare Directory & Open all Problems</a>
                  <div className="standing c-point" onClick={this.props.refreshStandings}>
                    <i className="icon-person"></i>
                    <span>{this.props.standing}</span>
                  </div>
                </div>
                <table className="table problemview">
                    <colgroup>
                        <col />
                        <col />
                        <col />
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
