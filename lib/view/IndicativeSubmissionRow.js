'use babel';

import React from 'react';
import path from 'path';
import Verdict from './Verdict';
import { handleError } from '../utils';
import ConfigStore from '../data/config-store';

export default class IndicativeSubmissionRow extends React.PureComponent {

    constructor(props) {
        super(props);

        this.clicked = this.clicked.bind(this);
    }

    clicked() {
        atom.workspace.open(path.join(this.props.problem.filePath, ConfigStore.getFileStructureSourceFileName()({ problem: this.props.problem.index, siblingPrefix: this.props.problem.siblingPrefix })),
                { split: 'up' }).catch(error => {
            handleError(error);
        })
    }

    render() {
        return <tr onClick={this.clicked}>
            <td className="rowcol">{this.props.problem.siblingPrefix}{this.props.problem.index} - {this.props.problem.name}</td>
            <td className="rowcol">
                { this.props.submission && <Verdict
                    verdict={this.props.submission.verdict}
                    testset={this.props.submission.testset}
                    passedTestCount={this.props.submission.passedTestCount} /> }
            </td>
            <td className="rowcol">{this.props.problem.subcount.length!=0 && (
              <div className="subcount">
                <i className="icon-person"></i>
                <span>{this.props.problem.subcount}</span>
              </div>
            )}</td>
        </tr>
    }

}
