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


// ***** TITLE: Use PKCE authentication with the Splunk Cloud JavaScript SDK to create
// *****        and retrieve a KVCollection dataset.
require('isomorphic-fetch');

const { SplunkCloud } = require('@splunkdev/cloud-sdk');
const { PKCEAuthManager, PKCEAuthManagerSettings } = require('../src');
const {
    IDP_CLIENT_ID,
    IDP_CLIENT_PASSWORD,
    IDP_CLIENT_USERNAME,
    SPLUNK_CLOUD_API_HOST,
    SPLUNK_CLOUD_AUTH_HOST,
    SPLUNK_CLOUD_LOGIN_REDIRECT_URL,
    TENANT_ID,
} = require('./config');

(async function () {
    const DATE_NOW = Date.now();
    const collectionModule = `collectionmodule`;
    const kvcollectionName = `kvcollection${DATE_NOW}`;

    // ***** STEP 1: Create PKCEAuthManagerSettings.
    const authSettings = new PKCEAuthManagerSettings(
        SPLUNK_CLOUD_AUTH_HOST,
        'openid offline_access email profile',
        IDP_CLIENT_ID,
        SPLUNK_CLOUD_LOGIN_REDIRECT_URL,
        IDP_CLIENT_USERNAME,
        IDP_CLIENT_PASSWORD);

    // ***** STEP 2: Create PKCEAuthManager.
    // ***** DESCRIPTION: Use the PKCEAuthManagerSettings.
    const authManager = new PKCEAuthManager(authSettings);

    // ***** STEP 3: Get Splunk Cloud client.
    // ***** DESCRIPTION: Get Splunk Cloud client of a tenant using the PKCEAuthManager.
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
