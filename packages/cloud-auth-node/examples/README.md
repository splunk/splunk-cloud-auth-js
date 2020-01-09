# @splunkdev/cloud-auth-node Examples

This directory contains a set of examples that utilize this library in conjunction with the [Splunk Cloud Services JavaScript SDK](https://github.com/splunk/splunk-cloud-sdk-js/) to authenticate with Splunk Cloud Services.

## Examples

### Configuration

To run the examples, configure the variable defined in [config.js](https://github.com/splunk/js-cloud-auth/tree/develop/packages/cloud-auth-node/examples/config.js).  This variables can be configured via node environment variables or directly hardcoded in the file.

### Run examples

Use the following npm scripts to run tests:

```sh-session
yarn && yarn build
yarn run test:examples
```
