# Splunk Cloud Services Cloud-Auth-Node

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Splunk Cloud Services Cloud-Auth-Node contains an authentication library for Node.js applications, along with code and examples to enable you to authenticate with Splunk Cloud Services in a Node.js-based application using the JavaScript programming language.

You can use the `@splunkdev/cloud-auth-node` library in conjunction with the [Splunk Cloud Services JavaScript SDK](https://github.com/splunk/splunk-cloud-sdk-js/) to programmatically access Splunk Cloud Services.

## Terms of Service

[Splunk Cloud Services Terms of Service](https://auth.scp.splunk.com/tos)

## Authorization flows

This library supports the following authorization flows:
* Client Credentials
* Proof Key for Code Exchange (PKCE)
* Refresh token with PKCE

For more about authorization flows that are supported by Splunk Cloud Services, see [Plan apps for Splunk Cloud Services](https://dev.splunk.com/scs/docs/apps/plan#Choose-an-authorization-flow) on the Splunk Developer Portal.

## Get started

Install the `@splunkdev/cloud-auth-node` package to enable your project to authenticate with Splunk Cloud Services.

Run the following command from your project directory if you use Yarn:

```sh-session
yarn add @splunkdev/cloud-auth-node
```
Run the following command from your project directory if you use npm:

```sh-session
npm install --save @splunkdev/cloud-auth-node
```

### Example

This example demonstrates how to use this library and the Client Credential authorization flow with the Splunk Cloud Services SDK for JavaScript.

```js
require('isomorphic-fetch'); // Or a fetch polyfill of your choosing

const { SplunkCloud } = require('@splunkdev/cloud-sdk');
const { ClientAuthManager, ClientAuthManagerSettings } = require('@splunkdev/cloud-auth-node');

// Initialize AuthManagerSettings
const authSettings = new ClientAuthManagerSettings(
    host = SPLUNK_CLOUD_AUTH_HOST,
    scope = '',
    clientId = CLIENT_CREDENTIAL_ID,
    clientSecret = CLIENT_CREDENTIAL_SECRET,
    grantType = 'client_credentials');

// Use AuthManagerSettings to initialize an AuthManager.
const authManager = new ClientAuthManager(authSettings);

// Use AuthManager as the tokenSource to initialize SplunkCloud.
const svc = new SplunkCloud({ tokenSource: authManager, defaultTenant: TENANT });

...

```

For additional examples, see the [examples directory](examples).

## Documentation

For Splunk Cloud Services documentation, see the [Splunk Developer Portal](https://dev.splunk.com/scs/).

## Contact

If you have questions, reach out to us on [Slack](https://splunkdevplatform.slack.com) in the **#sdc** channel or email us at _devinfo@splunk.com_.
