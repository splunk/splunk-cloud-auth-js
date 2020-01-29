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

import { AuthClient } from '@splunkdev/cloud-auth-client';
import { AuthClientSettings } from '@splunkdev/cloud-auth-client';
import React, { Component } from 'react';
import { Config } from './config';

// Create settings
const authClientSettings = new AuthClientSettings(
    Config.CLIENT_ID,
    Config.REDIRECT_URI,
    Config.ON_RESTORE_PATH,
    Config.AUTHORIZE_URL,
    Config.AUTO_REDIRECT_TO_LOGIN,
    Config.RESTORE_PATH_AFTER_LOGIN,
    Config.MAX_CLOCK_SKEW,
    Config.QUERY_PARAMS_FOR_LOGIN,
    Config.AUTO_TOKEN_RENEWAL_BUFFER
);

// Initialize AuthClient
const authClient = new AuthClient(authClientSettings);

class App extends Component {
    state = {
        loggedIn: false,
        error: null,
    };

    componentDidMount = async () => {
        await this.authenticate();
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
            <div>Authenticated!</div>
        );
    }
}

export default App;
