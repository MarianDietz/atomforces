'use babel';

import React from 'react';

// props: submit
// state: expanded
export default class SubmitButton extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = { expanded: false };
        this.expand = this.expand.bind(this);
        this.collapse = this.collapse.bind(this);
        this.submit = this.submit.bind(this);
    }

    expand() {
        this.setState({ expanded: true });
    }

    collapse() {
        this.setState({ expanded: false });
    }

    submit() {
        this.setState({ expanded: false });
        this.props.submit();
    }

    render() {
        if (this.state.expanded) {
            return <div>
                <button className="btn btn-error right-button" onClick={this.collapse}>Cancel</button>
                <button className="btn btn-primary right-button" onClick={this.submit} style={{ marginRight: '0.7em' }}>Submit</button>
            </div>
        } else {
            return <button className="btn right-button" onClick={this.expand}>Submit</button>
        }
    }

}
