'use babel';

import React from 'react';
import CollapsableSubsection from './CollapsableSubsection';

// props: contest
export default class StandingView extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.contest.standings) {
      var standings = this.props.contest.standings;
      if (standings.err != null) {
        return <span className="inline-block highlight-error">{standings.err}</span>
      }

      return (
        <div className="standcont">
          <table className="standtable">
            <tbody>
              <tr>
                <td className="text-bold">#</td>
                <td className="text-bold">Who</td>
                {standings.problems.map((problem, i) =>
                  <td key={i} className="text-info text-bold">{problem.index}</td>
                )}
              </tr>
              {standings.rows.map((row,i)=>{
                return (
                  <tr key={i}>
                    <td>{row.rank}</td>
                    <td>{row.party.members.map(x=> x.handle).join("-")}</td>
                    {row.problemResults.map((res, j)=>{
                      var sign = "", num = res.rejectedAttemptCount
                      if(res.points>0) sign="+"
                      else if(res.rejectedAttemptCount>0) sign="-"

                      if(num==0) num=""

                      return <td key={j} className={
                        (sign=="+"?"text-success":"") +
                        (sign=="-"?"text-info":"") +
                        " text-sm text-bold"
                      }>{sign}{num}</td>
                    })}
                  </tr>
                )
              })}
            </tbody>      
          </table>
        </div>
      )
    } else null;
  }

}
