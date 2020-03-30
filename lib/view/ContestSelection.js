'use babel';

import React from 'react';
import path from 'path';
import ContestProblemView from './ContestProblemView';

// props: paths, contestPathToIdMap
export default class ContestSelection extends React.Component {

    searchContestRoot(p) {
        p = path.normalize(p);
        while (!this.props.contestPathToIdMap.has(p)) {
            const next = path.normalize(path.dirname(p));
            if (path.relative(next, p) === '') return null;
            p = next;
        }
        return p;
    }

    getCorrespondingRoot(paths) {
        if (!paths || paths.length < 1) return null;
        if (paths.find(path => !path)) return null;

        const contestId = this.searchContestRoot(paths[0]);
        if (!contestId) return null;
        if (paths.slice(1).find(path => this.searchContestRoot(path) !== contestId)) return null;
        return contestId;
    }

    render() {
        const roots = this.props.paths
            .map(p => [p, this.getCorrespondingRoot(p)])
            .filter(([_, root]) => root != null);

        if (roots.length === 0) {
            return <ul className="background-message centered"> <li>No Contest Selected</li> </ul>
        } else {
            const root = roots[0][1];
            const contestId = this.props.contestPathToIdMap.get(root);
            const paths = roots
                .filter(([_, r]) => r === root)
                .map(([p, _]) => p.map(x => path.relative(root, x)));
            return <ContestProblemView contestId={contestId} paths={paths} />
        }
    }

}
