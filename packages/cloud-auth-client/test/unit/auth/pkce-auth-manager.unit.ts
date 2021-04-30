/* eslint-disable @typescript-eslint/camelcase */
import { AccessTokenResponse } from '@splunkdev/cloud-auth-common/src/auth-proxy';

import { PKCEAuthManager, PKCEAuthManagerSettings } from '../../../src/auth/pkce-auth-manager';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';
import { SplunkOAuthError } from '../../../src/error/splunk-oauth-error';
import { AccessToken } from '../../../src/model/access-token';

const AUTH_HOST = 'https://host.com';
const CLIENT_ID = 'clientid';
const REDIRECT_URI = 'https://redirect.com';
const REDIRECT_PARAMS_STORAGE_NAME = 'some-storage';
const REDIRECT_PATH_PARAMS_NAME = 'redirect-path';
const REDIRECT_OAUTH_PARAMS_NAME = 'redirect-oauth-params';
const USER_PARAM_INVITE_ID_KEY = 'inviteID';
const USER_PARAM_INVITE_TENANT_KEY = 'inviteTenant';
const CODE = 'iamcode';
const CLIENT_STATE = 'iamclientstate';
const STATE = '{"client_state":"iamclientstate","tenant":"system"}';
const CODE_VERIFIER = 'iamcodeverifier';
const CODE_CHALLENGE = 'iamcodechallenge';
const ERROR_MESSAGE = 'iamerrormessage';
const TOS_ERROR_MESSAGE = 'unsignedtos';
const ACCESS_TOKEN = 'accesstoken';
const EXPIRES_IN = 1000;
const TOKEN_TYPE = 'tokentype';
const SCOPES = 'scope0 scope1';
const REFRESH_TOKEN = 'refreshtoken';
const DEFAULT_ENABLE_TENANT_SCOPED_TOKENS = true;
const DEFAULT_ENABLE_MULTI_REGION_SUPPORT = false;

let mockStorageGet: jest.Mock;
let mockStorageSet: jest.Mock;
let mockStorageDelete: jest.Mock;
let mockStorageClear: jest.Mock;
jest.mock('../../../src/storage/storage-manager', () => {
    return {
        StorageManager: jest.fn().mockImplementation(() => {
            return {
                get: mockStorageGet,
                set: mockStorageSet,
                delete: mockStorageDelete,
                clear: mockStorageClear,
            };
        })
    };
});

let mockCodeVerifier: string;
let mockEncodedCodeVerifier: string;
let mockCodeChallenge: string;
let mockAuthHost: string;
let mockRegionAuthHost: string;
jest.mock('../../../src/common/util', () => {
    return {
        clearWindowLocationFragments: jest.fn(),
        generateRandomString: jest.fn().mockReturnValue('random'),
        generateCodeVerifier: jest.fn().mockImplementation(() => {
            return mockCodeVerifier;
        }),
        encodeCodeVerifier: jest.fn().mockImplementation(() => {
            return mockEncodedCodeVerifier;
        }),
        createCodeChallenge: jest.fn().mockImplementation(() => {
            return mockCodeChallenge;
        }),
        generateTenantBasedAuthHost: jest.fn().mockImplementation(() => {
            return mockAuthHost;
        }),
        generateRegionBasedAuthHost: jest.fn().mockImplementation(() => {
            return mockRegionAuthHost;
        }),
    };
});

let mockLoggerWarn: jest.Mock;
jest.mock('../../../src/common/logger', () => ({
    Logger: class {
        public static warn(message: string): void {
            mockLoggerWarn(message);
        }
    }
}));

jest.mock('../../../src/validator/pkce-param-validators', () => {
    return {
        validateSearchParameters: jest.fn(),
        validateOAuthParameters: jest.fn(),
        validateStateParameters: jest.fn(),
        validateUserParameters: jest.fn()
    };
});

let mockAuthProxyAccessToken: jest.Mock;
jest.mock('@splunkdev/cloud-auth-common', () => ({
    AuthProxy: class {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // eslint-disable-next-line no-unused-vars
        // eslint-disable-next-line class-methods-use-this
        public accessToken(url?: string): Promise<AccessToken> {
            return mockAuthProxyAccessToken(url);
        }

        public static readonly PATH_AUTHORIZATION: string = '/authorize';

        public static readonly PATH_LOGOUT: string = '/logout';

        public static readonly PATH_TOS: string = '/tos';
    }
}));


describe('PKCEAuthManager', () => {
    let pkceAuthManager: PKCEAuthManager;

    function getPKCEAuthManager(tenant?: string, region?: string, enableTenantScopedTokens: boolean = DEFAULT_ENABLE_TENANT_SCOPED_TOKENS, enableMultiRegionSupport: boolean = DEFAULT_ENABLE_MULTI_REGION_SUPPORT): PKCEAuthManager {
        return new PKCEAuthManager(
            new PKCEAuthManagerSettings(
                AUTH_HOST,
                CLIENT_ID,
                REDIRECT_URI,
                tenant,
                region,
                REDIRECT_PARAMS_STORAGE_NAME,
                enableTenantScopedTokens,
                enableMultiRegionSupport
            )
        );
    }

    beforeEach(() => {
        mockStorageGet = jest.fn();
        mockStorageSet = jest.fn();
        mockStorageDelete = jest.fn();
        mockStorageClear = jest.fn();
        mockAuthProxyAccessToken = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getRedirectPath', () => {
        it('gets redirect path from storage', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return 'some-redirect';
            });

            pkceAuthManager = getPKCEAuthManager();

            // Act
            const result = pkceAuthManager.getRedirectPath();

            // Assert
            expect(result).toEqual('some-redirect');
            expect(mockStorageGet).toBeCalledWith(REDIRECT_PATH_PARAMS_NAME);
            expect(mockStorageGet).toBeCalledTimes(1);
        });
    });

    describe('setRedirectPath', () => {
        it('sets redirect path in storage', () => {
            // Arrange
            pkceAuthManager = getPKCEAuthManager();

            // Act
            pkceAuthManager.setRedirectPath('some-redirect');

            // Assert
            expect(mockStorageSet).toBeCalledWith('some-redirect', REDIRECT_PATH_PARAMS_NAME);
            expect(mockStorageSet).toBeCalledTimes(1);
        });
    });

    describe('deleteRedirectPath', () => {
        it('deletes redirect path from storage', () => {
            // Arrange
            pkceAuthManager = getPKCEAuthManager();

            // Act
            pkceAuthManager.deleteRedirectPath();

            // Assert
            expect(mockStorageDelete).toBeCalledWith(REDIRECT_PATH_PARAMS_NAME);
            expect(mockStorageDelete).toBeCalledTimes(1);
        });
    });

    describe('getAccessToken', () => {

        it('throws SplunkAuthClientError when there are no redirect params in storage', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE}`;

            mockStorageGet = jest.fn(() => {
                return undefined;
            });

            pkceAuthManager = getPKCEAuthManager();

            // Act/Assert
            return pkceAuthManager.getAccessToken(urlMock)
                .then(() => {
                    done.fail('getAccessToken should not have succeeded.');
                })
                .catch(e => {
                    expect(e).toEqual(
                        new SplunkAuthClientError('Unable to retrieve and parse OAuth redirect params storage'));
                    expect(mockStorageGet).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageGet).toBeCalledTimes(1);
                    expect(mockStorageDelete).toBeCalledTimes(0);
                    done();
                });
        });

        it('throws SplunkAuthClientError when unable to decode and parse state parameter', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${CLIENT_STATE}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            pkceAuthManager = getPKCEAuthManager();

            // Act/Assert
            return pkceAuthManager.getAccessToken(urlMock)
                .then(() => {
                    done.fail('getAccessToken should not have succeeded.');
                })
                .catch(e => {
                    expect(e).toEqual(
                        new SplunkAuthClientError('Unable to parse state parameter to get user state'));
                    expect(mockStorageGet).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageGet).toBeCalledTimes(1);
                    expect(mockStorageDelete).toBeCalledTimes(0);
                    done();
                });
        });

        it('throws SplunkAuthClientError when unable to delete redirect parameters', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });
            mockStorageDelete = jest.fn(() => {
                throw new Error(ERROR_MESSAGE);
            });

            mockAuthProxyAccessToken = jest.fn((): Promise<AccessTokenResponse> => {
                return Promise.resolve({
                    access_token: ACCESS_TOKEN,
                    expires_in: EXPIRES_IN,
                    id_token: 'idtoken',
                    refresh_token: REFRESH_TOKEN,
                    token_type: TOKEN_TYPE,
                    scope: SCOPES
                });
            });

            pkceAuthManager = getPKCEAuthManager();

            // Act/Assert
            return pkceAuthManager.getAccessToken(urlMock)
                .then(() => {
                    done.fail('getAccessToken should not have succeeded.');
                })
                .catch(e => {
                    expect(e).toEqual(
                        new SplunkAuthClientError(
                            `Failed to remove the ${REDIRECT_OAUTH_PARAMS_NAME} data. ${ERROR_MESSAGE}`));
                    expect(mockStorageGet).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageGet).toBeCalledTimes(1);
                    expect(mockStorageDelete).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageDelete).toBeCalledTimes(2);
                    done();
                });
        });

        it('throws SplunkAuthClientError when unable to delete user parameters inviteID and inviteTenant key', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockStorageDelete = jest.fn()
                .mockImplementationOnce(
                    () => {
                        return 'successfully_deleted_redirect_params'; 
                    }
                )
                .mockImplementationOnce(
                    () => {
                        throw new Error(ERROR_MESSAGE); 
                    }
                )
                .mockImplementationOnce(
                    () => {
                        return 'successfully_deleted_redirect_params'; 
                    }
                )
                .mockImplementationOnce(
                    () => {
                        return 'successfully_deleted_user_params'; 
                    }
                )
                .mockImplementationOnce(
                    () => {
                        throw new Error(ERROR_MESSAGE); 
                    }
                );

            mockAuthProxyAccessToken = jest.fn((): Promise<AccessTokenResponse> => {
                return Promise.resolve({
                    access_token: ACCESS_TOKEN,
                    expires_in: EXPIRES_IN,
                    id_token: 'idtoken',
                    refresh_token: REFRESH_TOKEN,
                    token_type: TOKEN_TYPE,
                    scope: SCOPES
                });
            });

            pkceAuthManager = getPKCEAuthManager();

            // Act/Assert
            return pkceAuthManager.getAccessToken(urlMock)
                .then(() => {
                    done.fail('getAccessToken should not have succeeded.');
                })
                .catch(e => {
                    expect(e).toEqual(
                        new SplunkAuthClientError(
                            `Failed to remove the inviteTenant data from the user storage. ${ERROR_MESSAGE}`));
                    expect(mockStorageGet).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageGet).toBeCalledTimes(1);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(1, REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(2, USER_PARAM_INVITE_ID_KEY);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(3, REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(4, USER_PARAM_INVITE_ID_KEY);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(5, USER_PARAM_INVITE_TENANT_KEY);
                    expect(mockStorageDelete).toBeCalledTimes(5);
                    done();
                });
        });

        it('throws SplunkOAuthError when /token access token call fails', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockAuthProxyAccessToken = jest.fn((): Promise<AccessTokenResponse> => {
                return Promise.reject(new Error(ERROR_MESSAGE));
            });

            pkceAuthManager = getPKCEAuthManager();

            // Act/Assert
            return pkceAuthManager.getAccessToken(urlMock)
                .then(() => {
                    done.fail('getAccessToken should not have succeeded.');
                })
                .catch(e => {
                    expect(e).toEqual(
                        new SplunkOAuthError(
                            `Failed to retrieve access token from token endpoint. ${ERROR_MESSAGE}`));
                    expect(mockStorageGet).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageGet).toBeCalledTimes(1);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(1, REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(2, USER_PARAM_INVITE_ID_KEY);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(3, USER_PARAM_INVITE_TENANT_KEY);
                    expect(mockStorageDelete).toBeCalledTimes(3);
                    done();
                });
        });

        it('throws SplunkOAuthError when /token access token call fails due to unsigned TOS', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockAuthProxyAccessToken = jest.fn((): Promise<AccessTokenResponse> => {
                return Promise.reject(new Error(TOS_ERROR_MESSAGE));
            });

            pkceAuthManager = getPKCEAuthManager();

            // Act/Assert
            return pkceAuthManager.getAccessToken(urlMock)
                .then(() => {
                    done.fail('getAccessToken should not have succeeded.');
                })
                .catch(e => {
                    expect(e).toEqual(
                        new SplunkOAuthError(
                            `Failed to retrieve access token from token endpoint.`,
                            TOS_ERROR_MESSAGE
                        )
                    );
                    expect(mockStorageGet).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageGet).toBeCalledTimes(1);
                    expect(mockStorageDelete).toBeCalledTimes(0);
                    done();
                });

        });

        it('throws SplunkOAuthError when access token does not return refresh token', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockAuthProxyAccessToken = jest.fn((): Promise<AccessTokenResponse> => {
                return Promise.resolve({
                    access_token: ACCESS_TOKEN,
                    expires_in: EXPIRES_IN,
                    id_token: 'idtoken',
                    token_type: TOKEN_TYPE,
                    scope: SCOPES,
                    refresh_token: undefined
                });
            });

            pkceAuthManager = getPKCEAuthManager();

            // Act/Assert
            return pkceAuthManager.getAccessToken(urlMock)
                .then(() => {
                    done.fail('getAccessToken should not have succeeded.');
                })
                .catch(e => {
                    expect(e).toEqual(
                        new SplunkOAuthError(
                            `Failed to retrieve access token from token endpoint. Missing refresh token.`
                        )
                    );
                    expect(mockStorageGet).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageGet).toBeCalledTimes(1);
                    expect(mockStorageDelete).toBeCalledTimes(3);
                    done();
                });

        });

        it('returns globally scoped AccessToken when enableTenantScopedTokens flag is set to false', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE}&accept_tos=1`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockAuthProxyAccessToken = jest.fn((): Promise<AccessTokenResponse> => {
                return Promise.resolve({
                    access_token: ACCESS_TOKEN,
                    expires_in: EXPIRES_IN,
                    id_token: 'idtoken',
                    refresh_token: REFRESH_TOKEN,
                    token_type: TOKEN_TYPE,
                    scope: SCOPES
                });
            });

            const enableTenantScopedTokens = false;
            pkceAuthManager = getPKCEAuthManager('', '', enableTenantScopedTokens);

            // Act/Assert
            return pkceAuthManager.getAccessToken(urlMock)
                .then((accessToken: AccessToken) => {
                    expect(accessToken.accessToken).toEqual(ACCESS_TOKEN);
                    expect(accessToken.expiresAt).toBeLessThanOrEqual(EXPIRES_IN + Math.floor(Date.now() / 1000));
                    expect(accessToken.expiresIn).toEqual(EXPIRES_IN);
                    expect(accessToken.tokenType).toEqual(TOKEN_TYPE);
                    expect(accessToken.scopes).toEqual(SCOPES.split(' '));
                    expect(accessToken.refreshToken).toEqual(REFRESH_TOKEN);
                    expect(accessToken.tenant).toEqual('');
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(1, REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(2, USER_PARAM_INVITE_ID_KEY);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(3, USER_PARAM_INVITE_TENANT_KEY);
                    expect(mockStorageDelete).toBeCalledTimes(3);
                    expect(mockStorageSet).toBeCalledTimes(0);
                    done();
                })
                .catch((e) => {
                    done.fail(e);
                });
        });

        it('decode state, stores email, inviteID and inviteTenant and returns globally scoped AccessToken when enableTenantScopedTokens flag is set to false', async (done) => {
            // Arrange
            const encodedState = `{"accept_tos":true,"client_state":"${CLIENT_STATE}","email":"testuser@splunk.com","inviteID":"inviteme","inviteTenant":"testtenant","tenant":"system"}`
            const urlMock = `https://url.com/?code=${CODE}&state=${encodedState}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockAuthProxyAccessToken = jest.fn((): Promise<AccessTokenResponse> => {
                return Promise.resolve({
                    access_token: ACCESS_TOKEN,
                    expires_in: EXPIRES_IN,
                    id_token: 'idtoken',
                    refresh_token: REFRESH_TOKEN,
                    token_type: TOKEN_TYPE,
                    scope: SCOPES
                });
            });

            const enableTenantScopedTokens = false;
            pkceAuthManager = getPKCEAuthManager('', '', enableTenantScopedTokens);

            // Act/Assert
            return pkceAuthManager.getAccessToken(urlMock)
                .then((accessToken: AccessToken) => {
                    expect(accessToken.accessToken).toEqual(ACCESS_TOKEN);
                    expect(accessToken.expiresAt).toBeLessThanOrEqual(EXPIRES_IN + Math.floor(Date.now() / 1000));
                    expect(accessToken.expiresIn).toEqual(EXPIRES_IN);
                    expect(accessToken.tokenType).toEqual(TOKEN_TYPE);
                    expect(accessToken.scopes).toEqual(SCOPES.split(' '));
                    expect(accessToken.refreshToken).toEqual(REFRESH_TOKEN);
                    expect(accessToken.tenant).toEqual('');
                    expect(mockStorageSet).toBeCalledWith('testuser@splunk.com', 'email');
                    expect(mockStorageSet).toBeCalledWith('inviteme', 'inviteID');
                    expect(mockStorageSet).toBeCalledWith('testtenant', 'inviteTenant');
                    expect(mockStorageSet).toBeCalledTimes(3);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(1, REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(2, USER_PARAM_INVITE_ID_KEY);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(3, USER_PARAM_INVITE_TENANT_KEY);
                    expect(mockStorageDelete).toBeCalledTimes(3);
                    done();
                })
                .catch((e) => {
                    done.fail(e);
                });
        });

        it('returns system level tenant-scoped AccessToken', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE}&accept_tos=1`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockAuthProxyAccessToken = jest.fn((): Promise<AccessTokenResponse> => {
                return Promise.resolve({
                    access_token: ACCESS_TOKEN,
                    expires_in: EXPIRES_IN,
                    id_token: 'idtoken',
                    refresh_token: REFRESH_TOKEN,
                    token_type: TOKEN_TYPE,
                    scope: SCOPES
                });
            });

            pkceAuthManager = getPKCEAuthManager();

            // Act/Assert
            return pkceAuthManager.getAccessToken(urlMock)
                .then((accessToken: AccessToken) => {
                    expect(accessToken.accessToken).toEqual(ACCESS_TOKEN);
                    expect(accessToken.expiresAt).toBeLessThanOrEqual(EXPIRES_IN + Math.floor(Date.now() / 1000));
                    expect(accessToken.expiresIn).toEqual(EXPIRES_IN);
                    expect(accessToken.tokenType).toEqual(TOKEN_TYPE);
                    expect(accessToken.scopes).toEqual(SCOPES.split(' '));
                    expect(accessToken.refreshToken).toEqual(REFRESH_TOKEN);
                    expect(accessToken.tenant).toEqual('system');
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(1, REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(2, USER_PARAM_INVITE_ID_KEY);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(3, USER_PARAM_INVITE_TENANT_KEY);
                    expect(mockStorageDelete).toBeCalledTimes(3);
                    expect(mockStorageSet).toBeCalledTimes(0);
                    done();
                })
                .catch((e) => {
                    done.fail(e);
                });
        });

        it('decode state, stores email, inviteID and inviteTenant and returns tenant-scoped AccessToken', async (done) => {
            // Arrange
            const encodedState = `{"accept_tos":true,"client_state":"${CLIENT_STATE}","email":"testuser@splunk.com","inviteID":"inviteme","inviteTenant":"testtenant","tenant":"testtenant"}`
            const urlMock = `https://url.com/?code=${CODE}&state=${encodedState}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockAuthProxyAccessToken = jest.fn((): Promise<AccessTokenResponse> => {
                return Promise.resolve({
                    access_token: ACCESS_TOKEN,
                    expires_in: EXPIRES_IN,
                    id_token: 'idtoken',
                    refresh_token: REFRESH_TOKEN,
                    token_type: TOKEN_TYPE,
                    scope: SCOPES
                });
            });

            pkceAuthManager = getPKCEAuthManager();

            // Act/Assert
            return pkceAuthManager.getAccessToken(urlMock)
                .then((accessToken: AccessToken) => {
                    expect(accessToken.accessToken).toEqual(ACCESS_TOKEN);
                    expect(accessToken.expiresAt).toBeLessThanOrEqual(EXPIRES_IN + Math.floor(Date.now() / 1000));
                    expect(accessToken.expiresIn).toEqual(EXPIRES_IN);
                    expect(accessToken.tokenType).toEqual(TOKEN_TYPE);
                    expect(accessToken.scopes).toEqual(SCOPES.split(' '));
                    expect(accessToken.refreshToken).toEqual(REFRESH_TOKEN);
                    expect(accessToken.tenant).toEqual('testtenant');
                    expect(mockStorageSet).toBeCalledWith('testuser@splunk.com', 'email');
                    expect(mockStorageSet).toBeCalledWith('inviteme', 'inviteID');
                    expect(mockStorageSet).toBeCalledWith('testtenant', 'inviteTenant');
                    expect(mockStorageSet).toBeCalledTimes(3);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(1, REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(2, USER_PARAM_INVITE_ID_KEY);
                    expect(mockStorageDelete).toHaveBeenNthCalledWith(3, USER_PARAM_INVITE_TENANT_KEY);
                    expect(mockStorageDelete).toBeCalledTimes(3);
                    done();
                })
                .catch((e) => {
                    done.fail(e);
                });
        });
    });

    describe('generateAuthUrl', () => {
        it('without additional query params generates auth URL', () => {
            // Arrange
            mockCodeVerifier = '123';
            mockEncodedCodeVerifier = 'encoded123';
            mockCodeChallenge = 'abc';

            pkceAuthManager = getPKCEAuthManager();

            // Act
            const result = pkceAuthManager.generateAuthUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/authorize?client_id=clientid&code_challenge=abc&' +
                    'code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&' +
                    'state=random&nonce=random&scope=openid%20email%20profile%20offline_access&encode_state=1');
            expect(mockStorageSet)
                .toBeCalledWith(
                    JSON.stringify({
                        state: 'random',
                        codeVerifier: mockEncodedCodeVerifier,
                        codeChallenge: mockCodeChallenge
                    }),
                    REDIRECT_OAUTH_PARAMS_NAME);
            expect(mockStorageGet).toBeCalledTimes(1);
            expect(mockStorageSet).toBeCalledTimes(1);
        });

        it('with additional query params generates auth URL', () => {
            // Arrange
            mockCodeVerifier = '123';
            mockEncodedCodeVerifier = 'encoded123';
            mockCodeChallenge = 'abc';
            pkceAuthManager = getPKCEAuthManager();
            const map = new Map([
                ['customParam1', 'value1'],
                ['customParam2', undefined],
                ['customParam2', null],
            ]);

            // Act
            const result = pkceAuthManager.generateAuthUrl(map);

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/authorize?client_id=clientid&code_challenge=abc&' +
                    'code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&' +
                    'state=random&nonce=random&scope=openid%20email%20profile%20offline_access&encode_state=1&customParam1=value1');
            expect(mockStorageSet)
                .toBeCalledWith(
                    JSON.stringify({
                        state: 'random',
                        codeVerifier: mockEncodedCodeVerifier,
                        codeChallenge: mockCodeChallenge
                    }),
                    REDIRECT_OAUTH_PARAMS_NAME);
            expect(mockStorageGet).toBeCalledTimes(1);
            expect(mockStorageSet).toBeCalledTimes(1);
        });

        it('with email and tenant generates auth URL', () => {
            // Arrange
            mockCodeVerifier = '123';
            mockEncodedCodeVerifier = 'encoded123';
            mockCodeChallenge = 'abc';

            mockStorageGet = jest.fn(() => {
                return {"email":"testuser@splunk.com"};
            });

            pkceAuthManager = getPKCEAuthManager('testtenant');

            // Act
            const result = pkceAuthManager.generateAuthUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/authorize?client_id=clientid&code_challenge=abc&' +
                    'code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&' +
                    'state=random&nonce=random&scope=openid%20email%20profile%20offline_access&' +
                    'encode_state=1&tenant=testtenant&email=testuser%40splunk.com');
            expect(mockStorageSet)
                .toBeCalledWith(
                    JSON.stringify({
                        state: 'random',
                        codeVerifier: mockEncodedCodeVerifier,
                        codeChallenge: mockCodeChallenge
                    }),
                    REDIRECT_OAUTH_PARAMS_NAME);
            expect(mockStorageGet).toBeCalledTimes(1);
            expect(mockStorageSet).toBeCalledTimes(1);
        });

        it('with email and tenant generates tenant based auth URL', () => {
            // Arrange
            mockCodeVerifier = '123';
            mockEncodedCodeVerifier = 'encoded123';
            mockCodeChallenge = 'abc';

            mockStorageGet = jest.fn(() => {
                return {"email":"testuser@splunk.com"};
            });

            const testTenant = 'testtenant';
            mockAuthHost = `https://${testTenant}.host.com`;

            pkceAuthManager = getPKCEAuthManager(testTenant, '', true, true);
            // Act
            const result = pkceAuthManager.generateAuthUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual(`https://${testTenant}.host.com/authorize?client_id=clientid&code_challenge=abc&` +
                    `code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&` +
                    `state=random&nonce=random&scope=openid%20email%20profile%20offline_access&` +
                    `encode_state=1&tenant=${testTenant}&email=testuser%40splunk.com`);
            expect(mockStorageSet)
                .toBeCalledWith(
                    JSON.stringify({
                        state: 'random',
                        codeVerifier: mockEncodedCodeVerifier,
                        codeChallenge: mockCodeChallenge
                    }),
                    REDIRECT_OAUTH_PARAMS_NAME);
            expect(mockStorageGet).toBeCalledTimes(1);
            expect(mockStorageSet).toBeCalledTimes(1);
        });

        it('with email and a system tenant generates region based auth URL', () => {
            // Arrange
            mockCodeVerifier = '123';
            mockEncodedCodeVerifier = 'encoded123';
            mockCodeChallenge = 'abc';

            mockStorageGet = jest.fn(() => {
                return {"email":"testuser@splunk.com"};
            });

            const testTenant = 'system';
            const testRegion = 'sea10'
            mockAuthHost = `https://region-${testRegion}.host.com`;

            pkceAuthManager = getPKCEAuthManager(testTenant, testRegion, true, true);
            // Act
            const result = pkceAuthManager.generateAuthUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual(`https://region-${testRegion}.host.com/authorize?client_id=clientid&code_challenge=abc&` +
                    `code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&` +
                    `state=random&nonce=random&scope=openid%20email%20profile%20offline_access&` +
                    `encode_state=1&tenant=system&email=testuser%40splunk.com`);
            expect(mockStorageSet)
                .toBeCalledWith(
                    JSON.stringify({
                        state: 'random',
                        codeVerifier: mockEncodedCodeVerifier,
                        codeChallenge: mockCodeChallenge
                    }),
                    REDIRECT_OAUTH_PARAMS_NAME);
            expect(mockStorageGet).toBeCalledTimes(1);
            expect(mockStorageSet).toBeCalledTimes(1);
        });

        it('throws SplunkAuthClientError when unable to get stored user parameters', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                throw new Error(ERROR_MESSAGE);
            });

            // Act
            pkceAuthManager = getPKCEAuthManager();

            // Assert
            expect(() => pkceAuthManager.generateAuthUrl())
                .toThrow(new SplunkAuthClientError('Unable to retrieve user params storage'));
        });
    });

    describe('generateLogoutUrl', () => {
        it('deletes redirect path from storage', () => {
            // Arrange
            pkceAuthManager = getPKCEAuthManager();

            // Act
            const result = pkceAuthManager.generateLogoutUrl(REDIRECT_URI);

            // Assert
            expect(result).not.toBeNull();
            expect(result.href).toEqual('https://host.com/logout?redirect_uri=https%3A%2F%2Fredirect.com');
            expect(mockStorageClear).toBeCalledTimes(1);
        });
    });

    describe('generateTosUrl', () => {
        it('generates the tos url', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });
            pkceAuthManager = getPKCEAuthManager();

            // Act
            const result = pkceAuthManager.generateTosUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/tos?client_id=clientid&code_challenge=iamcodechallenge&' +
                    'code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&' +
                    'state=iamclientstate&scope=openid%20email%20profile%20offline_access&encode_state=1');
            expect(mockStorageGet).toBeCalledTimes(2);
        });

        it('with email, inviteID and inviteTenant and tenant generates the tos url', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });


            mockStorageGet = jest.fn()
                .mockImplementationOnce(
                    () => {
                        return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
                    }
                )
                .mockImplementationOnce(
                    () => {
                        return {"email":"testuser@splunk.com","inviteID":"inviteme","inviteTenant":"invitedtesttenant"}
                    }
                );

            pkceAuthManager = getPKCEAuthManager('testtenant');

            // Act
            const result = pkceAuthManager.generateTosUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/tos?client_id=clientid&code_challenge=iamcodechallenge&' +
                    'code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&' +
                    'state=iamclientstate&scope=openid%20email%20profile%20offline_access&' +
                    'encode_state=1&tenant=invitedtesttenant&email=testuser%40splunk.com&inviteID=inviteme');
            expect(mockStorageGet).toBeCalledTimes(2);
        });

        it('with email, inviteID and inviteTenant and tenant generates the tenant based tos url', () => {
            const testInviteTenant = 'invitedtesttenant';
            const testRegion = `region-foo`;
            mockRegionAuthHost = `https://${testRegion}.host.com`;
            // Arrange
            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });


            mockStorageGet = jest.fn()
                .mockImplementationOnce(
                    () => {
                        return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
                    }
                )
                .mockImplementationOnce(
                    () => {
                        return {"email":"testuser@splunk.com","inviteID":"inviteme","inviteTenant":testInviteTenant}
                    }
                );

            pkceAuthManager = getPKCEAuthManager('system', 'foo', true, true);

            // Act
            const result = pkceAuthManager.generateTosUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual(`https://${testRegion}.host.com/tos?client_id=clientid&code_challenge=iamcodechallenge&` +
                    `code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&` +
                    `state=iamclientstate&scope=openid%20email%20profile%20offline_access&` +
                    `encode_state=1&tenant=${testInviteTenant}&email=testuser%40splunk.com&inviteID=inviteme&region=region-foo`);
            expect(mockStorageGet).toBeCalledTimes(2);
        });

        it('with email and tenant generates the tos url', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockStorageGet = jest.fn()
                .mockImplementationOnce(
                    () => {
                        return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
                    }
                )
                .mockImplementationOnce(
                    () => {
                        return {"email":"testuser@splunk.com"}
                    }
                );

            pkceAuthManager = getPKCEAuthManager('testtenant');

            // Act
            const result = pkceAuthManager.generateTosUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/tos?client_id=clientid&code_challenge=iamcodechallenge&' +
                    'code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&' +
                    'state=iamclientstate&scope=openid%20email%20profile%20offline_access&' +
                    'encode_state=1&tenant=testtenant&email=testuser%40splunk.com');
            expect(mockStorageGet).toBeCalledTimes(2);
        });

        it('with email and tenant generates the tenant based tos url', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockStorageGet = jest.fn()
                .mockImplementationOnce(
                    () => {
                        return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
                    }
                )
                .mockImplementationOnce(
                    () => {
                        return {"email":"testuser@splunk.com"}
                    }
                );

            const testTenant = 'testtenant'
            const testRegion = `region-foo`;
            mockRegionAuthHost = `https://${testRegion}.host.com`;
            pkceAuthManager = getPKCEAuthManager(testTenant, 'foo', true, true);

            // Act
            const result = pkceAuthManager.generateTosUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual(`https://${testRegion}.host.com/tos?client_id=clientid&code_challenge=iamcodechallenge&` +
                    `code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&` +
                    `state=iamclientstate&scope=openid%20email%20profile%20offline_access&` +
                    `encode_state=1&tenant=${testTenant}&email=testuser%40splunk.com&region=region-foo`);
            expect(mockStorageGet).toBeCalledTimes(2);
        });

        it('with email and inviteID but no inviteTenant generates the tos url', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockStorageGet = jest.fn()
                .mockImplementationOnce(
                    () => {
                        return `{"state":"${CLIENT_STATE}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
                    }
                )
                .mockImplementationOnce(
                    () => {
                        return {"email":"testuser@splunk.com","inviteID":"inviteme"}
                    }
                );

            pkceAuthManager = getPKCEAuthManager('testtenant');

            // Act
            const result = pkceAuthManager.generateTosUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/tos?client_id=clientid&code_challenge=iamcodechallenge&' +
                    'code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&' +
                    'state=iamclientstate&scope=openid%20email%20profile%20offline_access&' +
                    'encode_state=1&email=testuser%40splunk.com&inviteID=inviteme');
            expect(mockStorageGet).toBeCalledTimes(2);
        });
    });
});
