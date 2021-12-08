'use babel';

import React from 'react';
import opn from 'opn';
import IndicativeSubmissionContainer from './IndicativeSubmissionContainer';
import StandingView from './StandingView';
import Countdown from './Countdown';

// props: contest
export default class ContestView extends React.Component {

    constructor(props) {
        super(props);

        this.state = { collapsed: true };
        this.toggleCollapsed = this.toggleCollapsed.bind(this);
        this.openProblemset = this.openProblemset.bind(this);
    }

    toggleCollapsed() {
        this.setState(state => ({ collapsed: !state.collapsed }));
        this.props.refreshStandings();
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
                  <div className="standing c-point" onClick={this.toggleCollapsed}>
                    <i className="icon-person"></i>
                    <span>{this.props.contest.rank}</span>
                  </div>
                </div>
                {this.state.collapsed?null:<StandingView contest={this.props.contest}/>}
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
