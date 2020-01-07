# Splunk Cloud Services Node Authentication Library

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

The Splunk Cloud Services Node Authentication Library contains code and examples to enable you to authenticate with Splunk Cloud Services in a Node-based application using the JavaScript programming language.

This library can be used in conjunction with the [Splunk Cloud Services JavaScript SDK](https://github.com/splunk/splunk-cloud-sdk-js/) to programmatically access Splunk Cloud Services.

## Terms of Service (TOS)
[Splunk Cloud Services Terms of Service](https://auth.scp.splunk.com/tos)

Log in to [Splunk Investigate](https://si.scp.splunk.com/) and accept the Terms of Service when prompted.

## Get started

### Install the Library

Install the library to enable your project to authenticate with Splunk Cloud Services services.

Run the following command from your project directory:

```sh
npm install @splunkdev/cloud-node-auth
```

### Example usage

This example demonstrates usage of the library with the SDK:

```js
require('isomorphic-fetch'); // or a fetch polyfill of your choosing

const { SplunkCloud } = require('@splunkdev/cloud-sdk');
const { ClientAuthManager, ClientAuthManagerSettings } = require('@splunkdev/cloud-node-auth');

// initialize AuthManagerSettings
const authSettings = new ClientAuthManagerSettings(
    host = SPLUNK_CLOUD_AUTH_HOST,
    scope = '',
    clientId = CLIENT_CREDENTIAL_ID,
    clientSecret = CLIENT_CREDENTIAL_SECRET,
    grantType = 'client_credentials');

// use AuthManagerSettings to initialize an AuthManager.
const authManager = new ClientAuthManager(authSettings);

// use AuthManager as the tokenSource to initialize SplunkCloud.
const svc = new SplunkCloud({ tokenSource: authManager, defaultTenant: TENANT });

...

```

Additional examples can be found under the examples directory.

## Documentation
For general documentation, see the [Splunk Developer Portal](https://developer.splunk.com/scs/).

For JavaScript SDK documentation, see the [Splunk Cloud Services SDK for JavaScript API Reference](https://developer.splunk.com/scs/reference/sdk/splunk-cloud-sdk-js).

## Contributing

## Contact
If you have questions, reach out to us on [Slack](https://splunkdevplatform.slack.com) in the **#sdc** channel or email us at _devinfo@splunk.com_.