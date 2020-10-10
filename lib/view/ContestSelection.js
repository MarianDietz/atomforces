'use babel';

import React from 'react';
import path from 'path';
import ContestProblemView from './ContestProblemView';
import ProblemContainer from './ProblemContainer';
import { searchRoot } from '../utils';

// props: paths, contestPathToIdMap, problemPathToIdMap
export default class ContestSelection extends React.Component {

    getCorrespondingRoot(paths, roots) {
        if (!paths || paths.length < 1) return null;
        if (paths.find(path => !path)) return null;

        const contestId = searchRoot(paths[0], roots);
        if (!contestId) return null;
        if (paths.slice(1).find(path => searchRoot(path, roots) !== contestId)) return null;
        return contestId;
    }

    render() {
        const contestRoots = this.props.paths
            .map(p => [p, this.getCorrespondingRoot(p, this.props.contestPathToIdMap)])
            .filter(([_, root]) => root != null);

        const standaloneProblemRoots = this.props.paths
            .map(p => [p, this.getCorrespondingRoot(p, this.props.problemPathToIdMap)])
            .filter(([_, root]) => root != null);

        if (contestRoots.length === 0 && standaloneProblemRoots.length === 0) {
            return <ul className="background-message centered"> <li>No Contest Selected</li> </ul>
        } else if (contestRoots.length > 0) {
            const root = contestRoots[0][1];
            const contestId = this.props.contestPathToIdMap.get(root);
            const paths = contestRoots
                .filter(([_, r]) => r === root)
                .map(([p, _]) => p.map(x => path.relative(root, x)));
            return <ContestProblemView contestId={contestId} paths={paths} />
        } else {
            const root = standaloneProblemRoots[0][1];
            const problemId = this.props.problemPathToIdMap.get(root);
            return <ProblemContainer problemId={problemId} />
        }
    }

}
