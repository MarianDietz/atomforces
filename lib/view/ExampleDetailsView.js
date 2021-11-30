'use babel';

import React from 'react';
import ExampleColumn from './ExampleColumn';

// props: example
export default class ExampleDetailsView extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
      return <div>
        {!this.props.example.producedStderr && (
          <div className="clearfix">
              {/* <ExampleColumn title="Input" text={this.props.example.input} /> */}
              <ExampleColumn title="Your Output" text={this.props.example.output} />
              <ExampleColumn title="Expected" text={this.props.example.expected} />
          </div>
        )}
        {this.props.example.producedStderr && (
          <div className="errcont">
            <ExampleColumn title="error" text={this.props.example.output} />
          </div>
        )}
      </div>
    }

}
