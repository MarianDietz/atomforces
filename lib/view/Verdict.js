'use babel';

import React from 'react';

// props: verdict, testset, passedTestCount
export default function Verdict(props) {
    var success = 'error';
    var str = 'Unknown';
    var appendTest = false;

    if (!props.verdict) { str = 'In Queue'; success = null; }
    else if (props.verdict === 'OK' && props.testset === 'PRETESTS') { str = 'Pretests passed'; success = 'success'; }
    else if (props.verdict === 'OK') { str = 'Accepted'; success = 'success'; }
    else if (props.verdict === 'FAILED') str = 'Failed';
    else if (props.verdict === 'PARTIAL') { str = 'Partial'; success = 'warning'; }
    else if (props.verdict === 'COMPILATION_ERROR') str = 'Compilation error';
    else if (props.verdict === 'RUNTIME_ERROR') { str = 'Runtime Error'; appendTest = true; }
    else if (props.verdict === 'WRONG_ANSWER') { str = 'Wrong Answer'; appendTest = true; }
    else if (props.verdict === 'PRESENTATION_ERROR') { str = 'Presentation Error'; appendTest = true; }
    else if (props.verdict === 'TIME_LIMIT_EXCEEDED') { str = 'Time Limit Exceeded'; appendTest = true; }
    else if (props.verdict === 'MEMORY_LIMIT_EXCEEDED') { str = 'Memory Limit Exceeded'; appendTest = true; }
    else if (props.verdict === 'IDLENESS_LIMIT_EXCEEDED') { str = 'Idleness Limit Exceeded'; appendTest = true; }
    else if (props.verdict === 'SECURITY_VIOLATED') str = 'Security Violated';
    else if (props.verdict === 'CRASHED') str = 'Crashed';
    else if (props.verdict === 'INPUT_PREPARATION_CRASHED') str = 'Input Preparation Crashed';
    else if (props.verdict === 'CHALLENGED') str = 'Hacked';
    else if (props.verdict === 'SKIPPED') str = 'Skipped';
    else if (props.verdict === 'TESTING') { str = 'Running'; success = 'info'; }
    else if (props.verdict === 'REJECTED') str = 'Rejected';

    if (appendTest) str = str + ' on ' + (props.testset === 'PRETESTS' ? 'pretest' : 'test') + ' ' + (props.passedTestCount + 1);
    return <span className={"badge " + (success ? 'badge-' + success : '')}>{str}</span>
}
