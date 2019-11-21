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

import 'isomorphic-fetch';
/*
 * Do not touch this process type declaration unless
 * you're prepared to deal with tsc compiler issues with @types/node
 * when trying to use the following import as a replacement.
 *
 * import 'node';
 *
 * See https://stackoverflow.com/a/50235545/2785681
 */
declare var process: {
    env: {
        [key: string]: string;
    }
};

export default {
    invalidAuthToken: 'BAD_TOKEN',
    stagingApiHost: process.env.SPLUNK_CLOUD_API_HOST || 'https://api.staging.scp.splunk.com',
    stagingAppsHost: process.env.SPLUNK_CLOUD_APPS_HOST || 'https://apps.staging.scp.splunk.com',
    stagingAuthToken: process.env.BEARER_TOKEN,
    stagingMLTenant: process.env.ML_TENANT_ID,
    stagingTenant: process.env.TENANT_ID,
    stubbyAuthToken: 'TEST_AUTH_TOKEN',
    stubbyDevTestTenant: 'devtestTenant',
    stubbyHost: process.env.CI ? 'splunk-cloud-sdk-shared-stubby' : 'localhost',
    stubbyTenant: 'TEST_TENANT',
    stubbyTestCollection: 'testcollection0',
    tenantCreationOn: (process.env.TENANT_CREATION === '1'),
    testCollection: `jscoll${Date.now()}`,
    testNamespace: `jsnmspace${Date.now()}`,
    testUsername: process.env.BACKEND_CLIENT_ID,
};
