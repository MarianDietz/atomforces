'use babel';

import React from 'react';
import { pathIsInside } from '../utils';
import ConfigStore from '../data/config-store';
import ProblemContainer from './ProblemContainer';

// props: problemIds (map from index to id), paths (relative from contest root), fileStructureProblemDirectory
export default class ProblemSelection extends React.Component {

    searchIndex(p, indices) {
        if (!p) return null;
        return indices.find(index => pathIsInside(this.props.fileStructureProblemDirectory({ problem: index }), p));
    }

    getCorrespondingIndex(paths, indices) {
        const index = this.searchIndex(paths[0], indices);
        if (!index) return null;
        if (paths.slice(1).find(path => this.searchIndex(path, indices) !== index)) return null;
        return index;
    }

    render() {
        var id = null;
        if (this.props.problemIds) {
            const indices = Array.from(this.props.problemIds.keys());
            const index = this.props.paths
                .map(p => this.getCorrespondingIndex(p, indices))
                .find(p => p != null);
            if (index != null) id = this.props.problemIds.get(index);
        }

        if (id == null) {
            return null;
        } else {
            return <ProblemContainer problemId={id} submissionClicked={this.props.submissionClicked} submit={this.props.submit} />
        }
    }

}
