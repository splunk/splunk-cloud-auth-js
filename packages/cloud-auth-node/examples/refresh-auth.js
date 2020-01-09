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


// ***** TITLE: Use a refresh token for authentication with the Splunk Cloud JavaScript SDK
// *****        to create and retrieve a KVCollection dataset.
require('isomorphic-fetch');

const { SplunkCloud } = require('@splunkdev/cloud-sdk');
const {
    PKCEAuthManager,
    PKCEAuthManagerSettings,
    RefreshAuthManager,
    RefreshAuthManagerSettings
} = require('../src');
const {
    IDP_CLIENT_ID,
    IDP_CLIENT_PASSWORD,
    IDP_CLIENT_USERNAME,
    SPLUNK_CLOUD_API_HOST,
    SPLUNK_CLOUD_AUTH_HOST,
    SPLUNK_CLOUD_LOGIN_REDIRECT_URL,
    TENANT_ID
} = require('./config');

/**
 * Using the PKCE Auth flow to retrieve a valid refresh token.
 */
async function retrieveRefreshToken() {
    const authSettings = new PKCEAuthManagerSettings(
        SPLUNK_CLOUD_AUTH_HOST,
        'openid offline_access email profile',
        IDP_CLIENT_ID,
        SPLUNK_CLOUD_LOGIN_REDIRECT_URL,
        IDP_CLIENT_USERNAME,
        IDP_CLIENT_PASSWORD);

    const authManager = new PKCEAuthManager(authSettings);

    return authManager.getAccessToken()
        .then(() => authManager.authContext.refreshToken);
}

(async function () {
    const DATE_NOW = Date.now();
    const collectionModule = `collectionmodule`;
    const kvcollectionName = `kvcollection${DATE_NOW}`;

    // ***** STEP 0: Retrieve Refresh Token using PKCE flow.
    const originalRefreshToken = await retrieveRefreshToken();

    // ***** STEP 1: Create RefreshAuthManagerSettings.
    const authSettings = new RefreshAuthManagerSettings(
        SPLUNK_CLOUD_AUTH_HOST,
        'openid',
        IDP_CLIENT_ID,
        'refresh_token',
        originalRefreshToken);

    // ***** STEP 2: Create RefreshAuthManager.
    // ***** DESCRIPTION: Use the RefreshAuthManagerSettings.
    const authManager = new RefreshAuthManager(authSettings);

    // ***** STEP 3: Get Splunk Cloud client.
    // ***** DESCRIPTION: Get Splunk Cloud client of a tenant using the RefreshAuthManager.
    const splunk = new SplunkCloud({
        urls: {
            api: SPLUNK_CLOUD_API_HOST
        },
        tokenSource: authManager,
        defaultTenant: TENANT_ID,
    });

    try {
        // ***** STEP 4: Create a kvcollection dataset to confirm that client authentication works.
        const kvCollectionDataset = await splunk.catalog.createDataset({
            name: kvcollectionName,
            module: collectionModule,
            kind: 'kvcollection',
        });
        console.log(`Kvcollection dataset created. name='${kvCollectionDataset.name}'`);
        console.log(kvCollectionDataset);
    } finally {
        // ***** STEP 5: Cleanup - Delete all created data sets.
        // ***** DESCRIPTION: Ignoring exceptions on cleanup.
        console.log('Cleaning up all created datasets.');
        await splunk.catalog.deleteDataset(`${collectionModule}.${kvcollectionName}`).catch(() => { });
    };
})().catch(error => console.error(error));
