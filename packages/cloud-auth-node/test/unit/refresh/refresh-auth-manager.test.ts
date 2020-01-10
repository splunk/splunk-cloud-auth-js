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

/* eslint-disable @typescript-eslint/camelcase */

import 'mocha';
import '../fixture/test-setup';

import { AccessTokenResponse, AuthProxy } from '@splunkdev/cloud-auth-common';
import { assert } from 'chai';
import * as sinon from 'sinon';

import { RefreshAuthManager, RefreshAuthManagerSettings } from '../../../src/refresh/refresh-auth-manager';

const MOCK_ACCESS_TOKEN = 'at';
const MOCK_CLIENT_ID = 'clientid';
const MOCK_GRANT_TYPE = 'granttype';
const MOCK_HOST = 'https://auth.host.com/';
const MOCK_ID_TOKEN = 'it';
const MOCK_REFRESH_TOKEN = 'rt';
const MOCK_SCOPE = 's';
const MOCK_TOKEN_TYPE = 'tt';
const TIME_MILLIS_BUFFER = 999999;

describe('RefreshAuthManager', () => {
    const mockAuthSettings =
        new RefreshAuthManagerSettings(MOCK_HOST, MOCK_SCOPE, MOCK_CLIENT_ID, MOCK_GRANT_TYPE, MOCK_REFRESH_TOKEN);
    let mockAuthProxy: AuthProxy;
    let authManager: RefreshAuthManager;

    const sandbox: sinon.SinonSandbox = sinon.createSandbox();

    beforeEach(() => {
        mockAuthProxy = new AuthProxy(MOCK_HOST);
        authManager = new RefreshAuthManager(mockAuthSettings, mockAuthProxy);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getAccessToken()', () => {
        it('should return a new access token string when auth context is not populated.', async () => {
            // Arrange
            const refreshAccessTokenStub =
                sandbox.stub(mockAuthProxy, 'refreshAccessToken')
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

            // Act
            const result = await authManager.getAccessToken();

            // Assert
            assert.equal(result, MOCK_ACCESS_TOKEN);
            assert(refreshAccessTokenStub.calledOnce);
            assert(refreshAccessTokenStub.calledWith(MOCK_CLIENT_ID, MOCK_GRANT_TYPE, MOCK_SCOPE, MOCK_REFRESH_TOKEN));
        });

        it('should return a new access token string when existing token is expired.', async () => {
            // Arrange
            const refreshAccessTokenStub =
                sandbox.stub(mockAuthProxy, 'refreshAccessToken')
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
            assert(refreshAccessTokenStub.calledOnce);
            assert(refreshAccessTokenStub.calledWith(MOCK_CLIENT_ID, MOCK_GRANT_TYPE, MOCK_SCOPE, MOCK_REFRESH_TOKEN));
        });

        it('should return an existing access token string when existing token is not expired.', async () => {
            // Arrange
            const refreshAccessTokenStub = sandbox.stub(mockAuthProxy, 'refreshAccessToken');
            const MOCK_OLD_TOKEN = 'oldtoken';
            authManager.authorizationContext.accessToken = MOCK_OLD_TOKEN;
            authManager.authorizationContext.tokenExpiration = new Date().getTime() + TIME_MILLIS_BUFFER;

            // Act
            const result = await authManager.getAccessToken();

            // Assert
            assert.equal(result, MOCK_OLD_TOKEN);
            assert(refreshAccessTokenStub.notCalled);
        });

        it('should throw SplunkAuthError when clientId is not specified', async () => {
            // Arrange
            authManager = new RefreshAuthManager(
                new RefreshAuthManagerSettings(MOCK_HOST, MOCK_SCOPE, '', MOCK_GRANT_TYPE, MOCK_REFRESH_TOKEN),
                mockAuthProxy);
            const refreshAccessTokenStub = sandbox.stub(mockAuthProxy, 'refreshAccessToken');
            const expectedErrorMessage = 'clientId is not specified.';

            // Act/Assert
            return assert.isRejected(
                authManager.getAccessToken(),
                expectedErrorMessage)
                .then(() => {
                    assert(refreshAccessTokenStub.notCalled);
                });
        });

        it('should throw SplunkAuthError when grantType is not specified', async () => {
            // Arrange
            authManager = new RefreshAuthManager(
                new RefreshAuthManagerSettings(MOCK_HOST, MOCK_SCOPE, MOCK_CLIENT_ID, '', MOCK_REFRESH_TOKEN),
                mockAuthProxy);
            const refreshAccessTokenStub = sandbox.stub(mockAuthProxy, 'refreshAccessToken');
            const expectedErrorMessage = 'grantType is not specified.';

            // Act/Assert
            return assert.isRejected(
                authManager.getAccessToken(),
                expectedErrorMessage)
                .then(() => {
                    assert(refreshAccessTokenStub.notCalled);
                });
        });

        it('should throw SplunkAuthError when refreshToken is not specified', async () => {
            // Arrange
            authManager = new RefreshAuthManager(
                new RefreshAuthManagerSettings(MOCK_HOST, MOCK_SCOPE, MOCK_CLIENT_ID, MOCK_GRANT_TYPE, ''),
                mockAuthProxy);
            const refreshAccessTokenStub = sandbox.stub(mockAuthProxy, 'refreshAccessToken');
            const expectedErrorMessage = 'refreshToken is not specified.';

            // Act/Assert
            return assert.isRejected(
                authManager.getAccessToken(),
                expectedErrorMessage)
                .then(() => {
                    assert(refreshAccessTokenStub.notCalled);
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
