import { assert, expect } from 'chai';

import defaultOptions from '../../src/auth.defaults';
import AuthClient from '../../src/AuthClient';
import config from '../../src/lib/config';
import { cookies } from '../../src/lib/cookies';
import StorageManager from '../../src/lib/storage';
import { TestData } from './fixture/testData';

describe('CloudAuth', () => {
    const clientId = '12345678';
    it('should initialize the client with clientId', () => {
        const authClient = new AuthClient({ clientId });
        expect(authClient.options.clientId).to.equal(clientId);
        expect(authClient.options.authorizeUrl).to.equal(defaultOptions.authorizeUrl);
    });

    it('should throw error if clientId is missing', () => {
        try {
            const authClient = new AuthClient({}); // eslint-disable-line no-unused-vars
            assert.isNotNull(authClient);
        } catch (e) {
            expect(e.message).to.equal('missing required configuration option `clientId`');
        }
    });

    describe('getAccessToken', () => {
        const authClient = new AuthClient({ clientId });
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
        const authClient = new AuthClient({ clientId });
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
            const client = new AuthClient({
                clientId,
                autoRedirectToLogin: false,
            });
            client.tokenManager.clear();
            return client.checkAuthentication().then(res => {
                expect(res).to.equal(false, 'missing access token');
            });
        });
    });

    describe('redirect', () => {
        const authClient = new AuthClient({ clientId });

        it('storePathBeforeLogin', () => {
            authClient.storePathBeforeLogin();
            const p = authClient.storage.get(config.REDIRECT_PATH_PARAMS_NAME);
            const path = window.location.pathname + window.location.search + window.location.hash;
            expect(p).to.equal(path);
        });

        it('restorePathAfterLogin', () => {
            authClient.storePathBeforeLogin();
            authClient.restorePathAfterLogin();
            const p = authClient.storage.get(config.REDIRECT_PATH_PARAMS_NAME);
            expect(p).to.equal(undefined, 'key is removed after restoring');
        });

        it('custom restorePath function', () => {
            const client = new AuthClient({
                clientId,
                onRestorePath: (): void => {
                    cookies.set('testKey', 'testValue');
                },
            });
            client.storePathBeforeLogin();
            client.restorePathAfterLogin();
            const p = cookies.get('testKey');
            expect(p).to.equal('testValue', 'custom function is executed');
            cookies.delete('testKey');
        });

        it('redirect to login', () => {
            authClient.redirectToLogin();
            const storage = new StorageManager(config.REDIRECT_PARAMS_STORAGE_NAME);
            const params = storage.get(config.REDIRECT_OAUTH_PARAMS_NAME);
            expect(params).to.have.string(TestData.AUTHORIZE_URL);
        });
    });

    describe('logout', () => {
        it('clear the tokens', () => {
            const authClient = new AuthClient({ clientId });
            authClient.options.baseDomain = '';
            authClient.tokenManager.add('accessToken', TestData.ACCESS_TOKEN_PARSED);

            expect(authClient.tokenManager.get('accessToken')).to.deep.equal(
                TestData.ACCESS_TOKEN_PARSED
            );

            authClient.logout();

            expect(authClient.tokenManager.get('accessToken')).to.equal(undefined);
        });
    });
});
