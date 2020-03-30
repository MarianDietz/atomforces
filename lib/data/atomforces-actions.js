'use babel';

import AtomforcesDispatcher from './atomforces-dispatcher';

export function clearStores() {
    console.log('CLEAR_STORES');
    AtomforcesDispatcher.dispatch({
        type: 'CLEAR_STORES'
    });
}

export function updateLogin(login) {
    console.log('UPDATE_LOGIN');
    console.log(login);
    AtomforcesDispatcher.dispatch({
        type: 'UPDATE_LOGIN',
        login
    });
}

export function addContest(contest) {
    console.log('ADD_CONTEST');
    console.log(contest);
    AtomforcesDispatcher.dispatch({
        type: 'ADD_CONTEST',
        contest
    });
}

export function updateContest(contestId, contest) {
    console.log('UPDATE_CONTEST');
    console.log(contestId);
    console.log(contest);
    AtomforcesDispatcher.dispatch({
        type: 'UPDATE_CONTEST',
        contestId,
        contest
    });
}

export function removeContest(contestId) {
    console.log('REMOVE_CONTEST');
    console.log(contestId);
    AtomforcesDispatcher.dispatch({
        type: 'REMOVE_CONTEST',
        contestId
    });
}

export function setProblems(contestId, problems) {
    console.log('SET_PROBLEMS');
    console.log(contestId);
    console.log(problems);
    AtomforcesDispatcher.dispatch({
        type: 'SET_PROBLEMS',
        contestId,
        problems
    });
}

export function setSubmissions(problemId, submissions) {
    console.log('SET_SUBMISSIONS');
    console.log(problemId);
    console.log(submissions);
    AtomforcesDispatcher.dispatch({
        type: 'SET_SUBMISSIONS',
        problemId,
        submissions
    });
}

export function updateCompilation(problemId, compilation) {
    console.log('UPDATE_COMPILATION');
    console.log(problemId);
    console.log(compilation);
    AtomforcesDispatcher.dispatch({
        type: 'UPDATE_COMPILATION',
        problemId,
        compilation
    });
}

export function updateProblem(problemId, problem) {
    console.log('UPDATE_PROBLEM');
    console.log(problemId);
    console.log(problem);
    AtomforcesDispatcher.dispatch({
        type: 'UPDATE_PROBLEM',
        problemId,
        problem
    });
}

export function setExamples(problemId, examples) {
    console.log('SET_EXAMPLES');
    console.log(problemId);
    console.log(examples);
    AtomforcesDispatcher.dispatch({
        type: 'SET_EXAMPLES',
        problemId,
        examples
    });
}

export function updateExample(problemId, example) {
    console.log('UPDATE_EXAMPLE');
    console.log(problemId);
    console.log(example);
    AtomforcesDispatcher.dispatch({
        type: 'UPDATE_EXAMPLE',
        problemId,
        example
    })
}
