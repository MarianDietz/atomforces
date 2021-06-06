'use babel';

import React from 'react';
import { pathIsInside } from '../utils';
import ConfigStore from '../data/config-store';
import ProblemContainer from './ProblemContainer';

// props: problemIds (map from index to id), paths (relative from contest root), fileStructureProblemDirectory
export default class ProblemSelection extends React.Component {

    searchId(p) {
        if (!p) return null;
        const problem =  this.props.problemIds.find(problem => pathIsInside(this.props.fileStructureProblemDirectory({ problem: problem.index, siblingPrefix: problem.siblingPrefix }), p));
        if (problem) return problem.id;
        else return null;
    }

    getCorrespondingId(paths) {
        const id = this.searchId(paths[0]);
        if (!id) return null;
        if (paths.slice(1).find(path => this.searchId(path) !== id)) return null;
        return id;
    }

    render() {
        var id = null;
        if (this.props.problemIds) {
            id = this.props.paths
                .map(p => this.getCorrespondingId(p))
                .find(p => p != null);
        }

        if (id == null) {
            return null;
        } else {
            return <ProblemContainer problemId={id} fetchSubmissionsNow={this.props.fetchSubmissionsNow} />
        }
    }

}
