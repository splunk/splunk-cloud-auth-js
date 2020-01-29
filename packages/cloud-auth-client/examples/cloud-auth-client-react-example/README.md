# @splunkdev/cloud-auth-client-react-example

This directory contains a sample application of usage of the `@splunkdev/cloud-auth-client` package to authenticate with Splunk Cloud Services using the TypeScript programming language and React JavaScript library.

## Get started

### Configuring settings

The file [config.ts](src/config.ts) contains the necessary fields for configuration.  Configuration can be set either via node environment variables or within the file itself.

One additional configuration variable that can only be set via node environment variables is the port. To do this you can execute the following commands:

```sh-session
export PORT=[[YOUR_PORT_NUMBER]]
```

### Running the application

1. Build the `@splunkdev/cloud-auth-client`:

```sh-session
cd [[ROOT_LEVEL_OF_REPOSITORY]]/packages/cloud-auth-client
yarn
yarn build
```

2. Build and run the sample application:

```sh-session
cd [[ROOT_LEVEL_OF_REPOSITORY]]/packages/cloud-auth-client/
yarn test:examples
cd [[ROOT_LEVEL_OF_REPOSITORY]]/packages/cloud-auth-client/examples/cloud-auth-client-react-example
yarn start
```

## Contact
If you have questions, reach out to us on [Slack](https://splunkdevplatform.slack.com) in the **#sdc** channel or email us at _devinfo@splunk.com_.
