import { assert, expect } from 'chai';

import { AuthClient } from '../../src/auth-client';
import { AuthClientSettings } from '../../src/auth-client-settings';
import { StorageManager } from '../../src/storage/storage-manager';
import { TestData } from './fixture/test-data';

const DEFAULT_AUTHORIZE_URL = 'https://auth.scp.splunk.com/authorize';
const REDIRECT_PATH_PARAMS_NAME = 'redirect-path';
const REDIRECT_OAUTH_PARAMS_NAME = 'redirect-oauth-params';
const REDIRECT_PARAMS_STORAGE_NAME = 'splunk-redirect-params-storage';

describe('CloudAuth', () => {
    const clientId = '12345678';
    it('should initialize the client with clientId', () => {
        const settings = new AuthClientSettings(
            clientId,
            ''
        );
        const authClient = new AuthClient(settings);
        expect(authClient.options.clientId).to.equal(clientId);
        expect(authClient.options.authorizeUrl).to.equal(DEFAULT_AUTHORIZE_URL);
    });

    it('should throw error if clientId is missing', () => {
        try {
            const settings = new AuthClientSettings(
                '',
                ''
            );
            const authClient = new AuthClient(settings);
            assert.isNotNull(authClient);
        } catch (e) {
            expect(e.message).to.equal('missing required configuration option `clientId`');
        }
    });

    describe('getAccessToken', () => {
        const settings = new AuthClientSettings(
            clientId,
            ''
        );
        const authClient = new AuthClient(settings);
        const accessToken = {
            accessToken: 'abc',
            scopes: ['openid'],
            expiresAt: 2252607417,
        };

        it('should return undefined if access token not present', () => {
            authClient.tokenManager.clear();
            const token = authClient.getAccessToken();
            assert.equal(token, undefined);
        });

        it('should return token if access token is set', () => {
            authClient.tokenManager.add('accessToken', accessToken);
            const token = authClient.getAccessToken();
            expect(token).to.equal(accessToken.accessToken);
        });

        it('should return undefined if access token expired', () => {
            accessToken.expiresAt = '1552607417';
            authClient.tokenManager.add('accessToken', accessToken);
            const token = authClient.getAccessToken();
            assert.equal(token, undefined);
        });
    });

    describe('authenticate', () => {
        const settings = new AuthClientSettings(
            clientId,
            ''
        );
        const authClient = new AuthClient(settings);
        const accessToken = {
            accessToken: 'abc',
            scopes: ['openid', 'email'],
            expiresAt: 2252607417,
        };
        it('should return false is access token is not present', () => {
            authClient.tokenManager.clear();
            const authenticated = authClient.isAuthenticated();
            assert.isFalse(authenticated);
        });

        it('should return true if access token is present', () => {
            authClient.tokenManager.add('accessToken', accessToken);
            const authenticated = authClient.isAuthenticated();
            assert.isTrue(authenticated);
        });

        it('checkAuthentication with existing access token', () => {
            authClient.tokenManager.add('accessToken', accessToken);
            return authClient
                .checkAuthentication()
                .then(res => {
                    expect(res).to.equal(true);
                })
                .catch(e => {
                    assert.fail(`should not fail. ${e.message}`);
                });
        });

        it('checkAuthentication without existing access token', () => {
            const client = new AuthClient(
                new AuthClientSettings(
                    clientId,
                    '',
                    undefined,
                    '',
                    false
                ));
            client.tokenManager.clear();
            return client.checkAuthentication().then(res => {
                expect(res).to.equal(false, 'missing access token');
            });
        });
    });

    describe('redirect', () => {
        const settings = new AuthClientSettings(
            clientId,
            ''
        );
        const authClient = new AuthClient(settings);

        it('storePathBeforeLogin', () => {
            authClient.storePathBeforeLogin();
            const p = authClient.storage.get(REDIRECT_PATH_PARAMS_NAME);
            const path = window.location.pathname + window.location.search + window.location.hash;
            expect(p).to.equal(path);
        });

        it('restorePathAfterLogin', () => {
            authClient.storePathBeforeLogin();
            authClient.restorePathAfterLogin();
            const p = authClient.storage.get(REDIRECT_PATH_PARAMS_NAME);
            expect(p).to.equal(undefined, 'key is removed after restoring');
        });

        it('custom restorePath function', () => {
            const client = new AuthClient(
                new AuthClientSettings(
                    clientId,
                    '',
                    () => {
                        authClient.storage.set('testValue', 'testKey');
                    }
                )
            );
            client.storePathBeforeLogin();
            client.restorePathAfterLogin();
            const p = authClient.storage.get('testKey');
            expect(p).to.equal('testValue', 'custom function is executed');
            authClient.storage.clear('testKey');
        });

        it('redirect to login', () => {
            authClient.redirectToLogin();
            const storage = new StorageManager(REDIRECT_PARAMS_STORAGE_NAME);
            const params = storage.get(REDIRECT_OAUTH_PARAMS_NAME);
            expect(params).to.have.string(TestData.AUTHORIZE_URL);
        });
    });

    describe('logout', () => {
        it('clear the tokens', () => {
            const settings = new AuthClientSettings(
                clientId,
                ''
            );
            const authClient = new AuthClient(settings);
            authClient.tokenManager.add('accessToken', TestData.ACCESS_TOKEN_PARSED);

            expect(authClient.tokenManager.get('accessToken')).to.deep.equal(
                TestData.ACCESS_TOKEN_PARSED
            );

            authClient.logout();

            expect(authClient.tokenManager.get('accessToken')).to.equal(undefined);
        });
    });
});
