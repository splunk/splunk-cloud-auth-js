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



/**
 * This file contains variables used in the examples.  They can be set as node environment variables or hardcoded below.
 *
 * Client Credential Authentication uses:
 *  - CLIENT_CREDENTIAL_ID
 *  - CLIENT_CREDENTIAL_SECRET
 *  - SPLUNK_CLOUD_AUTH_HOST
 *
 * PKCE Authentication uses:
 *  - IDP_CLIENT_ID
 *  - IDP_CLIENT_PASSWORD
 *  - IDP_CLIENT_USERNAME
 *  - SPLUNK_CLOUD_AUTH_HOST
 *  - SPLUNK_CLOUD_LOGIN_REDIRECT_URL
 *
 * Refresh Authentication uses:
 *  - IDP_CLIENT_ID
 *  - SPLUNK_CLOUD_AUTH_HOST
 *  - A Refresh Token (Can be retreived using PKCE)
 *
 * Splunk Cloud SDK uses:
 *  - SPLUNK_CLOUD_API_HOST
 *  - TENANT_ID
 */
const {
    CLIENT_CREDENTIAL_ID,
    CLIENT_CREDENTIAL_SECRET,
    IDP_CLIENT_ID,
    IDP_CLIENT_PASSWORD,
    IDP_CLIENT_USERNAME,
    SPLUNK_CLOUD_API_HOST,
    SPLUNK_CLOUD_AUTH_HOST,
    SPLUNK_CLOUD_LOGIN_REDIRECT_URL,
    TENANT_ID,
} = process.env;

module.exports = {
    CLIENT_CREDENTIAL_ID: CLIENT_CREDENTIAL_ID || 'YOUR_CLIENT_CREDENTIAL_ID',
    CLIENT_CREDENTIAL_SECRET: CLIENT_CREDENTIAL_SECRET || 'YOUR_CLIENT_CREDENTIAL_SECRET',
    IDP_CLIENT_ID: IDP_CLIENT_ID || 'YOUR_IDP_CLIENT_ID',
    IDP_CLIENT_PASSWORD: IDP_CLIENT_PASSWORD || 'YOUR_PASSWORD',
    IDP_CLIENT_USERNAME: IDP_CLIENT_USERNAME || 'YOUR_USERNAME',
    SPLUNK_CLOUD_API_HOST: SPLUNK_CLOUD_API_HOST || 'https://api.scp.splunk.com',
    SPLUNK_CLOUD_AUTH_HOST: SPLUNK_CLOUD_AUTH_HOST || 'https://auth.scp.splunk.com',
    SPLUNK_CLOUD_LOGIN_REDIRECT_URL: SPLUNK_CLOUD_LOGIN_REDIRECT_URL || 'https://YOUR_URL_USED_TO_REGISTER_CLIENT.com',
    TENANT_ID: TENANT_ID || 'YOUR_TENANT_ID'
};
