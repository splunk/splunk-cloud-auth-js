/**
 * Copyright 2020 Splunk, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"): you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

import {
    SplunkAuthClient,
    SplunkAuthClientSettings,
    GrantType,
    ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND,
    TOKEN_STORAGE_NAME,
    REDIRECT_PARAMS_STORAGE_NAME
} from '@splunkdev/cloud-auth-client';
import React, { Component } from 'react';
import { Config } from './config';

// Create settings
const authClientSettings = new SplunkAuthClientSettings(
    Config.GRANT_TYPE as GrantType,
    Config.CLIENT_ID,
    Config.REDIRECT_URI,
    Config.ON_RESTORE_PATH,
    Config.AUTH_HOST,
    Config.AUTO_REDIRECT_TO_LOGIN,
    Config.RESTORE_PATH_AFTER_LOGIN,
    Config.MAX_CLOCK_SKEW,
    Config.QUERY_PARAMS_FOR_LOGIN,
    Config.AUTO_TOKEN_RENEWAL_BUFFER,
    TOKEN_STORAGE_NAME,
    REDIRECT_PARAMS_STORAGE_NAME,
    Config.ENABLE_TENANT_SCOPED_TOKENS
);

// Initialize AuthClient
const authClient = new SplunkAuthClient(authClientSettings, '');

class App extends Component {
    state = {
        loggedIn: false,
        error: null,
        token: '',
    };

    public async componentDidMount() {
        await this.authenticate();
    }

    public async authenticate() {
        try {
            // AuthClient will redirect to login page if user is not authenticated.
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
                    console.error(e.toString());
                } else {
                    errorMessage = e.message ? e.message : e.toString();
                }
            }

            this.setState({
                loggedIn: false,
                error: errorMessage,
            });
        }
    }

    public login() {
        authClient.login();
    }

    public logout() {
        authClient.logout();
    }

    public async getToken() {
        const token = await authClient.getAccessTokenContext();
        console.log(JSON.stringify(token, null, '\t'));
    }

    public render() {
        const { error, loggedIn } = this.state;

        if (error) {
            return (
                <div>
                    <div>Error: {error}</div>
                </div>
            );
        }

        if (!loggedIn) {
            if (Config.AUTO_REDIRECT_TO_LOGIN) {
                return (
                    <div>
                        <div>Redirecting.</div>
                    </div>
                );
            }

            return (
                <div>
                    <div>Unauthenticated.</div>
                    <div>
                        <button id="login" onClick={this.login}>
                            {' '}
                            Login{' '}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div>
                <div>Authenticated!</div>
                <div>
                    <button id="login" onClick={this.login}>
                        {' '}
                        Login{' '}
                    </button>
                </div>
                <div>
                    <button id="logout" onClick={this.logout}>
                        {' '}
                        Logout{' '}
                    </button>
                </div>
                <div>
                    <button id="get-token" onClick={this.getToken}>
                        {' '}
                        Get Token{' '}
                    </button>
                </div>
            </div>
        );
    }
}

export default App;
