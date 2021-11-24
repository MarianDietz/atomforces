'use babel';

import React from 'react';
import LoginInformation from './LoginInformation';
import LoginStore from '../data/login-store';
import withStores from './Container';

class LoginInformationContainer extends React.PureComponent {

    render() {
        return <LoginInformation {...this.props.data} />
    }

}

export default withStores(
    LoginInformationContainer,
    props => [[LoginStore, '']],
    props => ({
        loggedIn: LoginStore.isLoggedIn(),
        handle: LoginStore.getHandle(),
        ... LoginStore.getData()
    }),
    { readdListeners: false }
);
