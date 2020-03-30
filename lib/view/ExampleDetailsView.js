'use babel';

import React from 'react';
import ExampleColumn from './ExampleColumn';

// props: example
export default class ExampleDetailsView extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return <div className="clearfix">
            <ExampleColumn title="Input" text={this.props.example.input} />
            <ExampleColumn title="Your Output" text={this.props.example.output} />
            <ExampleColumn title="Expected" text={this.props.example.expected} />
        </div>
    }

}
