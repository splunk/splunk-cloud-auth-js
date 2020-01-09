/**
 * Copyright 2019 Splunk, Inc.
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


// ***** TITLE: Use Client Credential authentication to retrieve an access token and verify authentication.
require('isomorphic-fetch');

const { ClientAuthManager, ClientAuthManagerSettings } = require('../src');
const {
    CLIENT_CREDENTIAL_ID,
    CLIENT_CREDENTIAL_SECRET,
    SPLUNK_CLOUD_AUTH_HOST
} = require('./config');

(async function () {
    // ***** STEP 1: Create ClientAuthManagerSettings.
    const authSettings = new ClientAuthManagerSettings(
        SPLUNK_CLOUD_AUTH_HOST,
        '',
        CLIENT_CREDENTIAL_ID,
        CLIENT_CREDENTIAL_SECRET,
        'client_credentials');

    // ***** STEP 2: Create ClientAuthManager.
    // ***** DESCRIPTION: Use the ClientAuthManagerSettings.
    const authManager = new ClientAuthManager(authSettings);

    // ***** STEP 3: Get the access token and verify authentication.
    // ***** DESCRIPTION: AuthManager API to retrieve and verify authentication.
    const accessToken = await authManager.getAccessToken();
    console.log(`Access token retreived=${accessToken !== undefined}`);

    const isAuthenticated = authManager.isAuthenticated();
    console.log(`Is authenticated=${isAuthenticated}`);

})().catch(error => console.error(error));
