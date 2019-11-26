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
const MOCK_HOST = 'https://auth.host.com';
const MOCK_ID_TOKEN = 'it';
const MOCK_REFRESH_TOKEN = 'rt';
const MOCK_SCOPE = 's';
const MOCK_TOKEN_TYPE = 'tt';
const PATH_AUTHN = '/authn';
const PATH_AUTHORIZATION = '/authorize';
const PATH_TOKEN = '/token';
const PATH_TOKEN_CSRF = '/csrfToken';

describe('AuthProxy', () => {
    const authProxy = new AuthProxy(MOCK_HOST);

    afterEach(() => {
        fetchMock.reset();
        fetchMock.restore();
    });

    describe('authorizationCode', () => {
        const CLIENT_ID = 'clientid';
        const CODE_CHALLENGE = 'codechallenge';
        const CODE_CHALLENGE_METHOD = 'codechallengemethod';
        const NONCE = 'nonce';
        const REDIRECT_URI = 'https://redirect.com/';
        const RESPONSE_TYPE = 'responsetype';
        const SCOPE = 'scope';
        const SESSION_TOKEN = 'sessiontoken';
        const STATE = 'state';

        it('should return a successful authorization code promise', async () => {
            // Arrange
            const AUTH_CODE = '1234abc';
            const responseUrl = `https://response.com?param=value&code=${AUTH_CODE}`;
            fetchMock.get(
                `${MOCK_HOST}${PATH_AUTHORIZATION}`
                + `?client_id=${CLIENT_ID}`
                + `&code_challenge=${CODE_CHALLENGE}`
                + `&code_challenge_method=${CODE_CHALLENGE_METHOD}`
                + `&nonce=${NONCE}`
                + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
                + `&response_type=${RESPONSE_TYPE}`
                + `&scope=${SCOPE}`
                + `&session_token=${SESSION_TOKEN}`
                + `&state=${STATE}&`,
                {
                    body: {},
                    redirectUrl: responseUrl
                });

            // Act
            const result = await authProxy.authorizationCode(
                CLIENT_ID,
                CODE_CHALLENGE,
                CODE_CHALLENGE_METHOD,
                NONCE,
                REDIRECT_URI,
                RESPONSE_TYPE,
                SCOPE,
                SESSION_TOKEN,
                STATE);

            // Assert
            assert.equal(result, AUTH_CODE);
        });
    });

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

    describe('csrfToken', () => {
        it('should return a successful csrf token response promise', async () => {
            // Arrange
            const COOKIE = 'abcdcookie';
            const CSRF_TOKEN = 'csrf_token';

            fetchMock.get(
                `${MOCK_HOST}${PATH_TOKEN_CSRF}`,
                {
                    body: {
                        csrf: CSRF_TOKEN
                    },
                    headers: {
                        'set-cookie': COOKIE
                    },
                    status: 200,
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

            // Act
            const result = await authProxy.csrfToken();

            // Assert
            assert.equal(result.csrfToken, 'csrf_token');
            assert.equal(result.cookies, COOKIE);
        });

        it('should throw SplunkAuthError when response status is not 200', async () => {
            // Arrange
            const STATUS_CODE = 429;
            const STATUS_TEXT = 'Too Many Requests';
            const expectedErrorMessage =
                `CSRF token call failed with status='${STATUS_CODE}', statusText='${STATUS_TEXT}'`;

            fetchMock.get(
                `${MOCK_HOST}${PATH_TOKEN_CSRF}`,
                {
                    status: STATUS_CODE
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

            // Act/Assert
            return assert.isRejected(authProxy.csrfToken(), expectedErrorMessage);
        });

        it('should throw SplunkAuthError when csrf token is not returned', async () => {
            // Arrange
            const STATUS_CODE = 429;
            const STATUS_TEXT = 'statustext';
            const expectedErrorMessage = 'Unable to retrieve CSRF token from csrfToken endpoint.';

            fetchMock.get(
                `${MOCK_HOST}${PATH_TOKEN_CSRF}`,
                {
                    status: STATUS_CODE,
                    statusText: STATUS_TEXT
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

            // Act/Assert
            return assert.isRejected(authProxy.csrfToken(), expectedErrorMessage);
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

    describe('sessionToken', () => {
        it('should return a successful session token response promise', async () => {
            // Arrange
            const USERNAME = 'username';
            const PASSWORD = 'password';
            const COOKIE = 'abcdcookie';
            const CSRF_TOKEN = 'csrf_token';
            const SESSION_TOKEN = 'abcdsessiontoken';

            fetchMock.post(
                `${MOCK_HOST}${PATH_AUTHN}`,
                {
                    body: {
                        sessionToken: SESSION_TOKEN,
                        status: 'SUCCESS',
                    },
                    status: 200,
                },
                {
                    body: {
                        csrftoken: CSRF_TOKEN,
                        password: PASSWORD,
                        username: USERNAME,
                    },
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Cookie': COOKIE,
                    },
                });

            // Act
            const result = await authProxy.sessionToken(USERNAME, PASSWORD, CSRF_TOKEN, COOKIE);

            // Assert
            assert.equal(result, SESSION_TOKEN);
        });

        it('should throw SplunkAuthError when response status is not 200', async () => {
            // Arrange
            const USERNAME = 'username';
            const PASSWORD = 'password';
            const COOKIE = 'abcdcookie';
            const CSRF_TOKEN = 'csrf_token';
            const STATUS_CODE = 429;
            const STATUS_TEXT = 'Too Many Requests';
            const expectedErrorMessage = `Authn call failed with status='${STATUS_CODE}', statusText='${STATUS_TEXT}'`;

            fetchMock.post(
                `${MOCK_HOST}${PATH_AUTHN}`,
                {
                    status: STATUS_CODE
                },
                {
                    body: {
                        csrftoken: CSRF_TOKEN,
                        password: PASSWORD,
                        username: USERNAME,
                    },
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Cookie': COOKIE,
                    },
                });

            // Act/Assert
            return assert.isRejected(
                authProxy.sessionToken(USERNAME, PASSWORD, CSRF_TOKEN, COOKIE),
                expectedErrorMessage);
        });

        it('should throw SplunkAuthError when response body status is not SUCCESS', async () => {
            // Arrange
            const USERNAME = 'username';
            const PASSWORD = 'password';
            const COOKIE = 'abcdcookie';
            const CSRF_TOKEN = 'csrf_token';
            const STATUS = 'ERROR';
            const expectedErrorMessage = `User authentication failed with status='${STATUS}'`;

            fetchMock.post(
                `${MOCK_HOST}${PATH_AUTHN}`,
                {
                    body: {
                        status: STATUS
                    },
                    status: 200,
                },
                {
                    body: {
                        csrftoken: CSRF_TOKEN,
                        password: PASSWORD,
                        username: USERNAME,
                    },
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Cookie': COOKIE,
                    },
                });

            // Act/Assert
            return assert.isRejected(
                authProxy.sessionToken(USERNAME, PASSWORD, CSRF_TOKEN, COOKIE),
                expectedErrorMessage);
        });

        it('should throw SplunkAuthError when response body session token is not returned', async () => {
            // Arrange
            const USERNAME = 'username';
            const PASSWORD = 'password';
            const COOKIE = 'abcdcookie';
            const CSRF_TOKEN = 'csrf_token';
            const expectedErrorMessage = `Unable to retrieve sessionToken from authn endpoint.`;

            fetchMock.post(
                `${MOCK_HOST}${PATH_AUTHN}`,
                {
                    body: {
                        status: 'SUCCESS'
                    },
                    status: 200,
                },
                {
                    body: {
                        csrftoken: CSRF_TOKEN,
                        password: PASSWORD,
                        username: USERNAME,
                    },
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Cookie': COOKIE,
                    },
                });

            // Act/Assert
            return assert.isRejected(
                authProxy.sessionToken(USERNAME, PASSWORD, CSRF_TOKEN, COOKIE),
                expectedErrorMessage);
        });
    });
});
