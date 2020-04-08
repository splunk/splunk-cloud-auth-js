# Migration from @splunkdev/cloud-auth to @splunkdev/cloud-auth-client

This guide describes how to migrate apps from version 1.1.0 of the Splunk Cloud Services Cloud Auth component [@splunkdev/cloud-auth](https://www.npmjs.com/package/@splunkdev/cloud-auth) to version 1.0.0 of [@splunkdev/cloud-auth-client](https://www.npmjs.com/package/@splunkdev/cloud-auth-client).

## API changes

### SplunkAuthClient

The following is a brief overview of the SplunkAuthClient API:

-   **getAccessToken()**
    -   Calls getAccessTokenContext() and attempts to return the access token.
-   **getAccessTokenContext()**
    -   Attempts to retrieve the access token context in session storage.
-   **isAuthenticated()**
    -   Checks for the existence of a token in session storage. If a token exists, the method uses the token content expiration time to verify that the token has not expired.
-   **login()**
    -   Redirects the client to the auth host /authorize endpoint to perform login.
-   **logout()**
    -   Redirects the client to the auth host /logout endpoint to perform logout and redirects the client back.

For more information, see [SplunkAuthClient](https://github.com/splunk/splunk-cloud-auth-js/blob/master/packages/cloud-auth-client/src/splunk-auth-client.ts).

### SplunkAuthClientSettings

The parameters and default values of the client settings have changed as follows:

-   **oauthFlow** is now **grantType**.  The **grantType** must be specified.  The supported OAuth Grant Types are "implicit" (the default) and "pkce".
-   **authorizeUrl** is no longer valid. The **authHost** parameter is used to specify the host for all authentication and authorization APIs. The default value is "https://auth.scp.splunk.com/". For usage details, see [AuthProxy](https://github.com/splunk/splunk-cloud-auth-js/blob/master/packages/cloud-auth-common/src/auth-proxy.ts).

For more information, see [SplunkAuthClientSettings](https://github.com/splunk/splunk-cloud-auth-js/blob/master/packages/cloud-auth-client/src/splunk-auth-client-settings.ts).

## Migrate your app

Follow these steps to migrate an existing app.

1. Update **package.json** to import the dependency **@splunkdev/cloud-auth-client**:
    
    ```json
    {
        // ...
        "dependencies": {
            "@splunkdev/cloud-auth-client": "^1.0.0"
            // ...
        }
    }
    ```
    
2. Update all **@splunkdev/cloud-auth** imports to **@splunkdev/cloud-auth-client**.
    
    -   The **AuthClient** client is renamed **SplunkAuthClient**.
    -   The client settings are now strongly typed using **SplunkAuthClientSettings**.
    
    ```ts
    import { SplunkAuthClient, SplunkAuthClientSettings } from '@splunkdev/cloud-auth-client';
    ```
    
3. Update your authentication code.
    
    The following code snippet shows how to authenticate using the **@splunkdev/cloud-auth-client** library:
    
    ```tsx
    import {
        SplunkAuthClient,
        SplunkAuthClientSettings,
        GrantType,
        ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND,
    } from '@splunkdev/cloud-auth-client';
    const authClientSettings = new SplunkAuthClientSettings(
        GrantType.IMPLICIT, // GrantType.PKCE for PKCE
        'YOUR_CLIENT_ID',
        'https://YOUR_REDIRECT_URI.com/',
        (path: string) => {
            // callback function that accepts a path value.  This is invoked on path restore.
        },
        'https://auth.scp.splunk.com/'
    );
    const authClient = new SplunkAuthClient(authClientSettings);
    class App extends Component {
        state = {
            loggedIn: false,
            error: null,
        };
        public async componentDidMount() {
            await this.authenticate();
        }
        public async authenticate() {
            try {
                // retrieve an access token to determine whether you are logged in.
                const loggedIn = (await authClient.getAccessToken()) !== '';
                this.setState({
                    loggedIn,
                });
            } catch (e) {
                let errorMessage = '';
                if (e) {
                    if (e.code === ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND) {
                        // This error code is surfaced when the client is unable to retrieve the OAuth parameters (including the access token)
                        // from the current window.location.href.
                    }
                    errorMessage = e.message ? e.message : e.toString();
                }
                this.setState({
                    loggedIn: false,
                    error: errorMessage,
                });
            }
        }
    }
    ```

## Examples

For an example of authentication, see <https://github.com/splunk/splunk-cloud-auth-js/blob/master/packages/cloud-auth-client/examples/cloud-auth-client-react-example/src/App.tsx>.

For a runnable React and TypeScript example that demonstrates how to use the @splunkdev/cloud-auth-client library, see <https://github.com/splunk/splunk-cloud-auth-js/tree/master/packages/cloud-auth-client/examples/cloud-auth-client-react-example>. 

This example demonstrates the following scenarios:

-   Logging in
-   Logging out
-   Authenticating on load
-   Retrieving the authentication token

## See also

For more about **@splunkdev/cloud-auth-client**, see: <https://github.com/splunk/splunk-cloud-auth-js/tree/master/packages/cloud-auth-client>

For more about **@splunkdev/cloud-auth-node** and **@splunkdev/cloud-auth-common** libraries, see <https://github.com/splunk/splunk-cloud-auth-js/>
