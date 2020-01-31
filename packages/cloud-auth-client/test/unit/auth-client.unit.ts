import { AuthClient } from '../../src/auth-client';
import { AuthClientSettings } from '../../src/auth-client-settings';
import { StorageManager } from '../../src/storage/storage-manager';
import { AccessToken } from '../../src/token-manager';
import { TestData } from './fixture/test-data';

const DEFAULT_AUTHORIZE_URL = 'https://auth.scp.splunk.com/authorize';
const REDIRECT_PATH_PARAMS_NAME = 'redirect-path';
const REDIRECT_OAUTH_PARAMS_NAME = 'redirect-oauth-params';
const REDIRECT_PARAMS_STORAGE_NAME = 'splunk-redirect-params-storage';

describe('AuthClient', () => {
    const clientId = '12345678';
    it('should initialize the client with clientId', () => {
        const settings = new AuthClientSettings(
            clientId,
            ''
        );
        const authClient = new AuthClient(settings);
        expect(authClient.options.clientId).toEqual(clientId);
        expect(authClient.options.authorizeUrl).toEqual(DEFAULT_AUTHORIZE_URL);
    });

    it('should throw error if clientId is missing', () => {
        try {
            const settings = new AuthClientSettings(
                '',
                ''
            );
            const authClient = new AuthClient(settings);
            expect(authClient).not.toBeNull();
        } catch (e) {
            expect(e.message).toEqual('missing required configuration option `clientId`');
        }
    });

    describe('getAccessToken', () => {
        const settings = new AuthClientSettings(
            clientId,
            ''
        );
        const authClient = new AuthClient(settings);
        const accessToken: AccessToken = {
            accessToken: 'abc',
            scopes: ['openid'],
            expiresAt: 2252607417,
            expiresIn: 99999,
            tokenType: 'Bearer'
        };

        it('should return undefined if access token not present', () => {
            authClient.tokenManager.clear();
            const token = authClient.getAccessToken();
            expect(token).toBeUndefined();;
        });

        it('should return token if access token is set', () => {
            authClient.tokenManager.set(accessToken);
            const token = authClient.getAccessToken();
            expect(token).not.toBeNull();
            expect(token.accessToken).toEqual(accessToken.accessToken);
        });

        it('should return undefined if access token expired', () => {
            accessToken.expiresAt = 1552607417;
            authClient.tokenManager.set(accessToken);
            const token = authClient.getAccessToken();
            expect(token).toBeUndefined();
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
            expiresIn: 99999,
            tokenType: 'Bearer'
        };
        it('should return false is access token is not present', () => {
            authClient.tokenManager.clear();
            const authenticated = authClient.isAuthenticated();
            expect(authenticated).toBeFalsy();
        });

        it('should return true if access token is present', () => {
            authClient.tokenManager.set(accessToken);
            const authenticated = authClient.isAuthenticated();
            expect(authenticated).toBeTruthy();
        });

        it('checkAuthentication with existing access token', async (done) => {
            authClient.tokenManager.set(accessToken);
            return authClient
                .checkAuthentication()
                .then(res => {
                    expect(res).toEqual(true);
                    done();
                })
                .catch(e => {
                    done.fail(`should not fail. ${e.message}`);
                });
        });

        it('checkAuthentication without existing access token', async (done) => {
            const client = new AuthClient(
                new AuthClientSettings(
                    clientId,
                    '',
                    undefined,
                    '',
                    false
                ));
            client.tokenManager.clear();
            return client
                .checkAuthentication()
                .then(res => {
                    // missing access token
                    expect(res).toEqual(false);
                    done();
                })
                .catch(e => {
                    done.fail(`should not fail. ${e.message}`);
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
            expect(p).toEqual(path);
        });

        it('restorePathAfterLogin', () => {
            authClient.storePathBeforeLogin();
            authClient.restorePathAfterLogin();
            const p = authClient.storage.get(REDIRECT_PATH_PARAMS_NAME);
            // key is removed after restoring
            expect(p).toEqual(undefined);
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
            // assert custom function is executed
            expect(p).toEqual('testValue');
            authClient.storage.clear('testKey');
        });

        it('redirect to login', () => {
            authClient.redirectToLogin();
            const storage = new StorageManager(REDIRECT_PARAMS_STORAGE_NAME);
            const params = storage.get(REDIRECT_OAUTH_PARAMS_NAME);
            expect(params).toContain(TestData.AUTHORIZE_URL);
        });
    });

    describe('logout', () => {
        it('clear the tokens', () => {
            const settings = new AuthClientSettings(
                clientId,
                ''
            );
            const authClient = new AuthClient(settings);
            authClient.tokenManager.set(TestData.ACCESS_TOKEN_PARSED);

            expect(authClient.tokenManager.get()).toStrictEqual(TestData.ACCESS_TOKEN_PARSED);

            authClient.logout();

            expect(authClient.tokenManager.get()).toEqual(undefined);
        });
    });
});
