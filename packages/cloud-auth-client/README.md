# Splunk Cloud Services Cloud-Auth-Client

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Splunk Cloud Services Cloud-Auth-Client contains an authentication library for front-end web applications, along with code and examples to enable you to authenticate with Splunk Cloud Services in a web application using the JavaScript programming language.

You can use the `@splunkdev/cloud-auth-client` library alone or in conjunction with the [Splunk Cloud Services JavaScript SDK](https://github.com/splunk/splunk-cloud-sdk-js/) to programmatically access Splunk Cloud Services.

## Terms of Service

[Splunk Cloud Services Terms of Service](https://auth.scp.splunk.com/tos)

## Authorization flows

This library supports the following authorization flows:
* Implicit

For more about authorization flows that are supported by Splunk Cloud Services, see [Plan apps for Splunk Cloud Services](https://dev.splunk.com/scs/docs/apps/plan#Choose-an-authorization-flow) on the Splunk Developer Portal.

## Get started

Install the `@splunkdev/cloud-auth-client` package to enable your project to authenticate with Splunk Cloud Services.

Run the following command from your project directory if you use Yarn:

```sh-session
yarn add @splunkdev/cloud-auth-client
```
Run the following command from your project directory if you use npm:

```sh-session
npm install --save @splunkdev/cloud-auth-client
```

## Example

The following example shows how to work with the `@splunkdev/cloud-auth-client` library.

### React web application

This example demonstrates how to use the `@splunkdev/cloud-auth-client` library in a React web application. For an example that you can run, see [examples/cloud-auth-client-react-example](examples/cloud-auth-client-react-example).

```ts
import AuthClient from '@splunkdev/cloud-auth-client/AuthClient';
import { AuthClientSettings } from '@splunkdev/cloud-auth-client/auth-client-settings';
import React, { Component } from 'react';

// Create settings.
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

// Initialize AuthClient.
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
        // AuthClient redirects to a login page if the user is not authenticated.
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

The following example sets configuration options for `AuthClient`.

```js
{
    // The clientId setting identifies the app that is registered with the App Registry service.
    clientId: "...", // required

    // The redirectUri function redirects the user to the web app after logging in.
    // The value of redirectUri must be pre-registered with the App Registry service.
    redirectUri: window.location.origin, // required

    // When this setting is enabled, the cloud-auth-client library restores 
    // the path of the web app after redirecting to the login page.
    // This setting is enabled (true) by default.
    restorePathAfterLogin: true,

    // If provided, this function is called when the user is redirected from login
    // after the auth callback is successfully applied.
    // You can use this function to integrate with third-party client-side
    // routers, such as react-router, rather than calling history.replaceState.
    onRestorePath: function(path) { /* ... */ },

    // When this setting is enabled, the user is automatically redirected to the
    // login page when the AuthClient instance is created, or when checkAuthentication
    // is called and the user is not already logged in.
    // This setting is enabled (true) by default.
    autoRedirectToLogin: true,

    // The redirect URL is used for redirecting to when using token.getWithRedirect.
    // This value must be pre-registered as part of client registration. 
    // If redirectUri is not provided, the value defaults to the current origin.
    redirectUri: "...",

    // The authorize URL is used to perform the authorization flow. 
    // The default value is the Splunk authorization server.
    authorizeUrl: "..."

    // This setting specifies the duration buffer, in seconds, for token expiration.
    // (now > actualExpiration - maxClockSkew) is considered to be expired.
    // The default value is 600.
    maxClockSkew: 600

    // This setting specifies the duration buffer, in seconds, for token auto-renewal.
    // (now > actualExpiration - autoTokenRenewalBuffer) triggers an auto renewal.
    // The default value is 120.
    autoTokenRenewalBuffer: 120
}
```

## Documentation

For Splunk Cloud Services documentation, see the [Splunk Developer Portal](https://dev.splunk.com/scs/).

## Contact

If you have questions, reach out to us on [Slack](https://splunkdevplatform.slack.com) in the **#sdc** channel or email us at _devinfo@splunk.com_.
