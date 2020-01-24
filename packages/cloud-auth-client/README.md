# @splunkdev/cloud-auth-client

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

The Splunk Cloud Services Web Application Authentication Library contains code and examples to enable you to authenticate with Splunk Cloud Services in a web application using the JavaScript programming language.

This library can be used alone or in conjunction with the [Splunk Cloud Services JavaScript SDK](https://github.com/splunk/splunk-cloud-sdk-js/) to programmatically access Splunk Cloud Services.

## Terms of Service (TOS)
[Splunk Cloud Services Terms of Service](https://auth.scp.splunk.com/tos)

Log in to [Splunk Investigate](https://si.scp.splunk.com/) and accept the Terms of Service when prompted.

## Get started

### Install the Library

Install the library to enable your project to authenticate with Splunk Cloud Services services.

Run the following command from your project directory:

```sh-session
yarn add @splunkdev/cloud-auth-client

# or

npm install --save @splunkdev/cloud-auth-client
```

### Example usage

#### React web application

This example demonstrates usage of the library in a React web application.  A runnable example exists at [examples/cloud-auth-client-react-example](examples/cloud-auth-client-react-example)

```ts
import AuthClient from '@splunkdev/cloud-auth-client/AuthClient';
import { AuthClientSettings } from '@splunkdev/cloud-auth-client/auth-client-settings';
import React, { Component } from 'react';

// Create settings
const authClientSettings = new AuthClientSettings(
  CLIENT_ID,
  REDIRECT_URI,
  ON_RESTORE_PATH,
  AUTHORIZE_URL,
  AUTO_REDIRECT_TO_LOGIN,
  RESTORE_PATH_AFTER_LOGIN,
  MAX_CLOCK_SKEW,
  QUERY_PARAMS_FOR_LOGIN,
  AUTO_TOKEN_RENEWAL_BUFFER
);

// Initialize AuthClient
const authClient = new AuthClient(authClientSettings);

class App extends Component {
    state = {
        loggedIn: false,
        error: null,
    };

    componentDidMount() {
        // Authenticate on mount
        this.authenticate();
    }

    authenticate = async () => {
        try {
        // AuthClient will redirect to login page if user is not authenticated.
        const loggedIn = await authClient.checkAuthentication();
        this.setState({
            loggedIn,
        });
        } catch (e) {
        this.setState({
            loggedIn: false,
            error: e,
        });
        }
    };

    render() {
        const { error, loggedIn } = this.state;

        if (error) {
        return (
            <div>Error: {error}</div>
        );
        }

        if (!loggedIn) {
        return (
            <div>Loading ...</div>
        );
        }

        return (
        <div>Authenticated: {String(loggedIn)}</div>
        );
    }
}
```

#### AuthClient configuration

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

## Documentation
For general documentation, see the [Splunk Developer Portal](https://developer.splunk.com/scs/).

For JavaScript SDK documentation, see the [Splunk Cloud Services SDK for JavaScript API Reference](https://developer.splunk.com/scs/reference/sdk/splunk-cloud-sdk-js).

## Contact
If you have questions, reach out to us on [Slack](https://splunkdevplatform.slack.com) in the **#sdc** channel or email us at _devinfo@splunk.com_.
