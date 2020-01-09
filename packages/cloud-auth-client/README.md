# @splunkdev/cloud-auth-client

Library to help authenticating web applications in Splunk Cloud.

## Install

```sh-session
$ yarn add @splunkdev/cloud-auth-client

# or

$ npm install --save @splunkdev/cloud-auth-client
```

## Usage Example

```js
"auth": {
        "clientId": "your_client_id",
}
```

```js
import AuthClient from '@splunkdev/cloud-auth-client/AuthClient';
import { auth as authConfig } from '../config/config.json';
export default new AuthClient({
    ...authConfig,
    redirectUri: window.location.origin, // eslint-disable-line
});

// ...
import React, { Component } from 'react';

class App extends Component {
    state = {
        loggedIn: false,
        error: null,
    };

    componentDidMount() {
        this.authenticate();
    }

    authenticate = async () => {
        try {
            // authClient will redirect to login page if user is not authenticated.
            const loggedIn = await authClient.checkAuthentication();
            this.setState({
                loggedIn,
            });
        } catch (e) {
            this.setState({
                loggedIn: false,
                error: e.message,
            });
        }
    };

    render() {
        const { error, loggedIn } = this.state;

        if (error) {
            return <div>Error: {error}</div>;
        }

        if (!loggedIn) {
            return <div>Loading...</div>;
        }

        return <div>My App...</div>;
    }
}
```

## Configuration

Configuration Options for `AuthClient`:

```js
{
    // Client ID is used to identify the app registred with the App Registry
    clientId: "...", // required

    // The redirect URI is used to redirect the user back to the web app after
    // login. This redirectUri must be registered with the App Registry
    redirectUri: window.location.origin, // required

    // If enabled, then the @splunkdev/cloud-auth-client lib will restore the path of the web app
    // after redirecting to login page
    restorePathAfterLogin: true,

    // This function is called (if provided) when the user was redirected back
    // from login, after the auth callback was successfully applied.
    // This function can be used to integrate with third-party client-side
    // routers, such as react-router intead of calling `history.replaceState`.
    onRestorePath: function(path) { /* ... */ },

    // If enabled, the user is automatically redirected to login page when
    // the AuthClient instance is created or when checkAuthentication is called
    // and the user is no already logged in.
    // This is enabled by default but can be disabled by setting it to `false`.
    autoRedirectToLogin: true,

    // The url that is redirected to when using token.getWithRedirect.
    // This must be pre-registered as part of client registration. If no redirectUri is provided, defaults to the current origin.
    redirectUri: "...",

    // authorizeUrl to perform the authorization flow. Defaults to Splunk authorize server.
    authorizeUrl: "..."

    // maxClockSkew specifies the duration buffer in seconds for token expiration
    // (now > actualExpiration - maxClockSkew) will be considered expired
    //
    // Default value is 600
    maxClockSkew: 600

    // autoTokenRenewalBuffer specifies the duration buffer in seconds for token auto renewal.
    // (now > actualExpiration - autoTokenRenewalBuffer) will trigger an auto renewal
    //
    // Default value is 120
    autoTokenRenewalBuffer: 120
}
```
