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
import 'mocha';
import * as sinon from 'sinon';
import { AccessTokenResponse, AuthProxy, CsrfTokenResponse } from '../../../src/common/auth-proxy';
import {
    PKCEAuthManager,
    PKCEAuthManagerSettings,
    PKCECodeFlowHelper
} from '../../../src/pkce/pkce-auth-manager';
import '../fixture/test-setup';

const MOCK_ACCESS_TOKEN = 'at';
const MOCK_CLIENT_ID = 'clientid';
const MOCK_HOST = 'https://auth.host.com/';
const MOCK_ID_TOKEN = 'it';
const MOCK_PASSWORD = 'password';
const MOCK_REDIRECT_URI = 'https://redirect.com/';
const MOCK_REFRESH_TOKEN = 'rt';
const MOCK_SCOPE = 's';
const MOCK_TOKEN_TYPE = 'tt';
const MOCK_USERNAME = 'username';
const TIME_MILLIS_BUFFER = 999999;

describe('PKCEAuthManager', () => {
    const mockAuthSettings =
        new PKCEAuthManagerSettings(
            MOCK_HOST, MOCK_SCOPE, MOCK_CLIENT_ID, MOCK_REDIRECT_URI, MOCK_USERNAME, MOCK_PASSWORD);
    let mockAuthProxy: AuthProxy;
    let mockPkceCodeFlowHelper: PKCECodeFlowHelper;
    let authManager: PKCEAuthManager;

    const sandbox: sinon.SinonSandbox = sinon.createSandbox();

    beforeEach(() => {
        mockAuthProxy = new AuthProxy(MOCK_HOST);
        mockPkceCodeFlowHelper = new PKCECodeFlowHelper();
        authManager = new PKCEAuthManager(mockAuthSettings, mockAuthProxy, mockPkceCodeFlowHelper);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getAccessToken()', () => {
        const COOKIE = 'cookie';
        const CSRF_TOKEN = 'csrftoken';
        const SESSION_TOKEN = 'sessiontoken';
        const CODE_VERIFIER = 'codeverifier';
        const CODE_CHALLENGE = 'codechallenge';
        const AUTHORIZATION_CODE = 'authorizationcode';
        const CODE_VERIFIER_LENGTH = 50;

        it('should return a new access token string when auth context is not populated.', async () => {
            // Arrange
            const csrfTokenStub = sandbox.stub(mockAuthProxy, 'csrfToken')
                .returns(new Promise<CsrfTokenResponse>((resolve) => {
                    resolve({
                        cookies: COOKIE,
                        csrfToken: CSRF_TOKEN
                    });
                }));
            const sessionTokenStub = sandbox.stub(mockAuthProxy, 'sessionToken')
                .returns(new Promise<string>((resolve) => {
                    resolve(SESSION_TOKEN);
                }));
            const codeVerifierStub = sandbox.stub(mockPkceCodeFlowHelper, 'createCodeVerifier')
                .returns(CODE_VERIFIER);
            const codeChallengeStub = sandbox.stub(mockPkceCodeFlowHelper, 'createCodeChallenge')
                .returns(CODE_CHALLENGE);
            const authorizationCodeStub = sandbox.stub(mockAuthProxy, 'authorizationCode')
                .returns(new Promise<string>((resolve) => {
                    resolve(AUTHORIZATION_CODE);
                }));
            const tokenStub =
                sandbox.stub(mockAuthProxy, 'accessToken')
                    .returns(new Promise<AccessTokenResponse>((resolve) => {
                        resolve({
                            access_token: MOCK_ACCESS_TOKEN,
                            expires_in: new Date().getTime() + TIME_MILLIS_BUFFER,
                            id_token: MOCK_ID_TOKEN,
                            refresh_token: MOCK_REFRESH_TOKEN,
                            scope: MOCK_SCOPE,
                            token_type: MOCK_TOKEN_TYPE
                        });
                    }));

            // Act/Assert
            const result = await authManager.getAccessToken();

            // Assert
            assert.equal(result, MOCK_ACCESS_TOKEN);
            assert.equal(authManager.authorizationContext.accessToken, MOCK_ACCESS_TOKEN);
            assert.equal(authManager.authorizationContext.idToken, MOCK_ID_TOKEN);
            assert.equal(authManager.authorizationContext.refreshToken, MOCK_REFRESH_TOKEN);
            assert.equal(authManager.authorizationContext.scope, MOCK_SCOPE);
            assert.isTrue(authManager.authorizationContext.tokenExpiration > new Date().getTime());
            assert.equal(authManager.authorizationContext.tokenType, MOCK_TOKEN_TYPE);

            assert(csrfTokenStub.calledOnce);
            assert(sessionTokenStub.calledOnce);
            assert(sessionTokenStub.calledWith(MOCK_USERNAME, MOCK_PASSWORD, CSRF_TOKEN, COOKIE));
            assert(codeVerifierStub.calledOnce);
            assert(codeVerifierStub.calledWith(CODE_VERIFIER_LENGTH));
            assert(codeChallengeStub.calledOnce);
            assert(codeChallengeStub.calledWith(CODE_VERIFIER));
            assert(authorizationCodeStub.calledOnce);
            assert(authorizationCodeStub.calledWith(
                MOCK_CLIENT_ID,
                CODE_CHALLENGE,
                'S256',
                'none',
                MOCK_REDIRECT_URI,
                'code',
                MOCK_SCOPE,
                SESSION_TOKEN));
            assert(tokenStub.calledOnce);
            assert(tokenStub.calledWith(MOCK_CLIENT_ID, AUTHORIZATION_CODE, CODE_VERIFIER, MOCK_REDIRECT_URI));
        });

        it('should return a new access token string when existing token is expired.', async () => {
            // Arrange
            const csrfTokenStub = sandbox.stub(mockAuthProxy, 'csrfToken')
                .returns(new Promise<CsrfTokenResponse>((resolve) => {
                    resolve({
                        cookies: COOKIE,
                        csrfToken: CSRF_TOKEN
                    });
                }));
            const sessionTokenStub = sandbox.stub(mockAuthProxy, 'sessionToken')
                .returns(new Promise<string>((resolve) => {
                    resolve(SESSION_TOKEN);
                }));
            const codeVerifierStub = sandbox.stub(mockPkceCodeFlowHelper, 'createCodeVerifier')
                .returns(CODE_VERIFIER);
            const codeChallengeStub = sandbox.stub(mockPkceCodeFlowHelper, 'createCodeChallenge')
                .returns(CODE_CHALLENGE);
            const authorizationCodeStub = sandbox.stub(mockAuthProxy, 'authorizationCode')
                .returns(new Promise<string>((resolve) => {
                    resolve(AUTHORIZATION_CODE);
                }));
            const tokenStub =
                sandbox.stub(mockAuthProxy, 'accessToken')
                    .returns(new Promise<AccessTokenResponse>((resolve) => {
                        resolve({
                            access_token: MOCK_ACCESS_TOKEN,
                            expires_in: new Date().getTime() + TIME_MILLIS_BUFFER,
                            id_token: MOCK_ID_TOKEN,
                            refresh_token: MOCK_REFRESH_TOKEN,
                            scope: MOCK_SCOPE,
                            token_type: MOCK_TOKEN_TYPE
                        });
                    }));
            const MOCK_OLD_TOKEN = 'oldtoken';
            authManager.authorizationContext.accessToken = MOCK_OLD_TOKEN;
            authManager.authorizationContext.tokenExpiration = new Date().getTime() - TIME_MILLIS_BUFFER;

            // Act/Assert
            const result = await authManager.getAccessToken();

            // Assert
            assert.equal(result, MOCK_ACCESS_TOKEN);
            assert.equal(authManager.authorizationContext.accessToken, MOCK_ACCESS_TOKEN);
            assert.equal(authManager.authorizationContext.idToken, MOCK_ID_TOKEN);
            assert.equal(authManager.authorizationContext.refreshToken, MOCK_REFRESH_TOKEN);
            assert.equal(authManager.authorizationContext.scope, MOCK_SCOPE);
            assert.isTrue(authManager.authorizationContext.tokenExpiration > new Date().getTime());
            assert.equal(authManager.authorizationContext.tokenType, MOCK_TOKEN_TYPE);

            assert(csrfTokenStub.calledOnce);
            assert(sessionTokenStub.calledOnce);
            assert(sessionTokenStub.calledWith(MOCK_USERNAME, MOCK_PASSWORD, CSRF_TOKEN, COOKIE));
            assert(codeVerifierStub.calledOnce);
            assert(codeVerifierStub.calledWith(CODE_VERIFIER_LENGTH));
            assert(codeChallengeStub.calledOnce);
            assert(codeChallengeStub.calledWith(CODE_VERIFIER));
            assert(authorizationCodeStub.calledOnce);
            assert(authorizationCodeStub.calledWith(
                MOCK_CLIENT_ID,
                CODE_CHALLENGE,
                'S256',
                'none',
                MOCK_REDIRECT_URI,
                'code',
                MOCK_SCOPE,
                SESSION_TOKEN));
            assert(tokenStub.calledOnce);
            assert(tokenStub.calledWith(MOCK_CLIENT_ID, AUTHORIZATION_CODE, CODE_VERIFIER, MOCK_REDIRECT_URI));
        });

        it('should return an existing access token string when existing token is not expired.', async () => {
            // Arrange
            const csrfTokenStub = sandbox.stub(mockAuthProxy, 'csrfToken');
            const MOCK_OLD_TOKEN = 'oldtoken';
            authManager.authorizationContext.accessToken = MOCK_OLD_TOKEN;
            authManager.authorizationContext.tokenExpiration = new Date().getTime() + TIME_MILLIS_BUFFER;

            // Act
            const result = await authManager.getAccessToken();

            // Assert
            assert.equal(result, MOCK_OLD_TOKEN);
            assert(csrfTokenStub.notCalled);
        });

        it('should throw SplunkAuthError when clientId is not specified', async () => {
            // Arrange
            authManager = new PKCEAuthManager(
                new PKCEAuthManagerSettings(
                    MOCK_HOST, MOCK_SCOPE, '', MOCK_REDIRECT_URI, MOCK_USERNAME, MOCK_PASSWORD),
                mockAuthProxy,
                mockPkceCodeFlowHelper);
            const csrfTokenStub = sandbox.stub(mockAuthProxy, 'csrfToken');
            const expectedErrorMessage = 'clientId is not specified.';

            // Act/Assert
            return assert.isRejected(
                authManager.getAccessToken(),
                expectedErrorMessage)
                .then(() => {
                    assert(csrfTokenStub.notCalled);
                });
        });

        it('should throw SplunkAuthError when redirectUri is not specified', async () => {
            // Arrange
            authManager = new PKCEAuthManager(
                new PKCEAuthManagerSettings(
                    MOCK_HOST, MOCK_SCOPE, MOCK_CLIENT_ID, '', MOCK_USERNAME, MOCK_PASSWORD),
                mockAuthProxy,
                mockPkceCodeFlowHelper);
            const csrfTokenStub = sandbox.stub(mockAuthProxy, 'csrfToken');
            const expectedErrorMessage = 'redirectUri is not specified.';

            // Act/Assert
            return assert.isRejected(
                authManager.getAccessToken(),
                expectedErrorMessage)
                .then(() => {
                    assert(csrfTokenStub.notCalled);
                });
        });
    });

    describe('isAuthenticated()', () => {
        it('should return true when accessToken is populated and not expired.', () => {
            // Arrange
            authManager.authorizationContext.accessToken = MOCK_ACCESS_TOKEN;
            authManager.authorizationContext.tokenExpiration = new Date().getTime() + TIME_MILLIS_BUFFER;

            // Act
            const result = authManager.isAuthenticated();

            // Assert
            assert.isTrue(result);
        });

        it('should return false when accessToken is populated and expired.', () => {
            // Arrange
            authManager.authorizationContext.accessToken = MOCK_ACCESS_TOKEN;
            authManager.authorizationContext.tokenExpiration = new Date().getTime() - TIME_MILLIS_BUFFER;

            // Act
            const result = authManager.isAuthenticated();

            // Assert
            assert.isFalse(result);
        });

        it('should return false when accessToken is not populated.', () => {
            // Act
            const result = authManager.isAuthenticated();

            // Assert
            assert.isFalse(result);
        });
    });
});
