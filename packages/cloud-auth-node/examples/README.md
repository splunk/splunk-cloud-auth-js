# Examples for Splunk Cloud Services Cloud-Auth-Node

This directory contains examples that demonstrate how to authenticate with Splunk Cloud Services using this library with the [Splunk Cloud Services SDK for JavaScript](https://github.com/splunk/splunk-cloud-sdk-js/).

## Configure, build, and run the examples

1. Configure the variables defined in [config.js](config.js). 
   
    You can configure these variables using node environment variables or hard code the values directly in the file.

2. Use the npm scripts as follows to run build and run the examples:

    ```sh-session
    yarn && yarn build
    yarn run test:examples
    ```
