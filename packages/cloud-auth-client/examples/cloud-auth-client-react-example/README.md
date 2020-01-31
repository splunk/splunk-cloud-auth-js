# Example for Splunk Cloud Services Cloud-Auth-Client

This directory contains an example app that shows how to use the `@splunkdev/cloud-auth-client` library to authenticate users with Splunk Cloud Services using the TypeScript programming language and React JavaScript library.

## Get started

1. Configure the app. 

    The [config.ts](src/config.ts) files contains configuration variables that you can set by using node environment variables or by saving the values directly in the file. 

    The port can only be set by using a node environment variable. For example, run the following command: 

    ```sh-session
    export PORT=[[YOUR_PORT_NUMBER]]
    ```

2. Build the `@splunkdev/cloud-auth-client` package. For example, run the following commands:

    ```sh-session
    cd [[ROOT_LEVEL_OF_REPOSITORY]]/packages/cloud-auth-client
    yarn
    yarn build
    ```

3. Run the app. For example, run the following commands:

    ```sh-session
    cd [[ROOT_LEVEL_OF_REPOSITORY]]/packages/cloud-auth-client/
    yarn test:examples
    cd [[ROOT_LEVEL_OF_REPOSITORY]]/packages/cloud-auth-client/examples/cloud-auth-client-react-example
    yarn start
    ```

## Contact

If you have questions, reach out to us on [Slack](https://splunkdevplatform.slack.com) in the **#sdc** channel or email us at _devinfo@splunk.com_.
