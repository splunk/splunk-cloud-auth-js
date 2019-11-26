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

'use strict';

import { assert } from 'chai';
import * as fetchMock from 'fetch-mock';
import 'mocha';
import { AuthProxy } from '../../../src/common/auth-proxy';
import '../fixture/test-setup';

const MOCK_ACCESS_TOKEN = 'at';
const MOCK_EXPIRES_IN = 1000;
const MOCK_HOST = 'https://auth.host.com/';
const MOCK_ID_TOKEN = 'it';
const MOCK_REFRESH_TOKEN = 'rt';
const MOCK_SCOPE = 's';
const MOCK_TOKEN_TYPE = 'tt';
const PATH_TOKEN = 'token';

describe('AuthProxy', () => {
    const authProxy = new AuthProxy(MOCK_HOST);

    afterEach(fetchMock.restore);

    describe('clientAccessToken', () => {
        const CLIENT_ID = 'clientid';
        const CLIENT_SECRET = 'clientsecret';
        const GRANT_TYPE = 'granttype';
        const SCOPE = 'scope';
        it('should return a successful AccessTokenResponse promise', async () => {
            // Arrange
            // TODO: figure out how to assert the body.
            fetchMock.post(
                `${MOCK_HOST}${PATH_TOKEN}`,
                {
                    body: {
                        access_token: MOCK_ACCESS_TOKEN,
                        expires_in: MOCK_EXPIRES_IN,
                        id_token: MOCK_ID_TOKEN,
                        scope: MOCK_SCOPE,
                        token_type: MOCK_TOKEN_TYPE
                    },
                    status: 200,
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': 'Basic Y2xpZW50aWQ6Y2xpZW50c2VjcmV0',
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                });

            // Act
            const result = await authProxy.clientAccessToken(CLIENT_ID, CLIENT_SECRET, GRANT_TYPE, SCOPE);

            // Assert
            assert.equal(result.access_token, MOCK_ACCESS_TOKEN);
            assert.equal(result.expires_in, MOCK_EXPIRES_IN);
            assert.equal(result.id_token, MOCK_ID_TOKEN);
            assert.equal(result.scope, MOCK_SCOPE);
            assert.equal(result.token_type, MOCK_TOKEN_TYPE);
        });
    });

    describe('accessToken', () => {
        const CLIENT_ID = 'clientid';
        const AUTH_CODE = 'authcode';
        const CODE_VERIFIER = 'codeverifier';
        const REDIRECT_URI = 'https://redirect.com/';
        it('should return a successful AccessTokenResponse promise', async () => {
            // Arrange
            // TODO: figure out how to assert the body.
            fetchMock.post(
                `${MOCK_HOST}${PATH_TOKEN}`,
                {
                    body: {
                        access_token: MOCK_ACCESS_TOKEN,
                        expires_in: MOCK_EXPIRES_IN,
                        id_token: MOCK_ID_TOKEN,
                        refresh_token: MOCK_REFRESH_TOKEN,
                        scope: MOCK_SCOPE,
                        token_type: MOCK_TOKEN_TYPE
                    },
                    status: 200,
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

            // Act
            const result = await authProxy.accessToken(CLIENT_ID, AUTH_CODE, CODE_VERIFIER, REDIRECT_URI);

            // Assert
            assert.equal(result.access_token, MOCK_ACCESS_TOKEN);
            assert.equal(result.expires_in, MOCK_EXPIRES_IN);
            assert.equal(result.id_token, MOCK_ID_TOKEN);
            assert.equal(result.refresh_token, MOCK_REFRESH_TOKEN);
            assert.equal(result.scope, MOCK_SCOPE);
            assert.equal(result.token_type, MOCK_TOKEN_TYPE);
        });
    });
});
