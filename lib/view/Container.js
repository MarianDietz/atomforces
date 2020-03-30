'use babel';

import React from 'react';

export default function withStores(WrappedComponent, subscriptions, calculateState, { readdListeners }) {

    return class extends React.Component {
        constructor(props) {
            super(props);

            this.state = { data: calculateState(props) };
            this.listener = () => {
                this.setState({ data: calculateState(this.props) });
            }
            subscriptions(props).forEach(([store, event]) => {
                store.addListener(event, this.listener);
            });
        }

        UNSAFE_componentWillReceiveProps(nextProps) {
            if (readdListeners) {
                subscriptions(this.props).forEach(([store, event]) => {
                    store.removeListener(event, this.listener);
                });
                this.setState({ data: calculateState(nextProps) });
                subscriptions(nextProps).forEach(([store, event]) => {
                    store.addListener(event, this.listener);
                });
            }
        }

        componentWillUnmount() {
            subscriptions(this.props).forEach(([store, event]) => {
                store.removeListener(event, this.listener);
            });
        }

        render() {
            return <WrappedComponent data={this.state.data} {...this.props} />
        }
    }

}
