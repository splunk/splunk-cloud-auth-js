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
const CODE = 'iamcode';
const STATE_0 = 'iamstate0';
const STATE_1 = 'iamstate1';
const CODE_VERIFIER = 'iamcodeverifier';
const CODE_CHALLENGE = 'iamcodechallenge';
const ERROR_MESSAGE = 'iamerrormessage';
const TOS_ERROR_MESSAGE = 'unsignedtos';
const ACCESS_TOKEN = 'accesstoken';
const EXPIRES_IN = 1000;
const TOKEN_TYPE = 'tokentype';
const SCOPES = 'scope0 scope1';

let mockStorageGet: jest.Mock;
let mockStorageSet: jest.Mock;
let mockStorageDelete: jest.Mock;
jest.mock('../../../src/storage/storage-manager', () => {
    return {
        StorageManager: jest.fn().mockImplementation(() => {
            return {
                get: mockStorageGet,
                set: mockStorageSet,
                delete: mockStorageDelete
            };
        })
    };
});

let mockCodeVerifier: string;
let mockEncodedCodeVerifier: string;
let mockCodeChallenge: string;
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
        validateOAuthParameters: jest.fn()
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

    function getPKCEAuthManager(): PKCEAuthManager {
        return new PKCEAuthManager(
            new PKCEAuthManagerSettings(
                AUTH_HOST,
                CLIENT_ID,
                REDIRECT_URI,
                REDIRECT_PARAMS_STORAGE_NAME
            )
        );
    }

    beforeEach(() => {
        mockStorageGet = jest.fn();
        mockStorageSet = jest.fn();
        mockStorageDelete = jest.fn();
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
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE_0}`;

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

        it('throws SplunkOAuthError when search parameter state and redirect parameters state are not equal',
            async (done) => {
                // Arrange
                const urlMock = `https://url.com/?code=${CODE}&state=${STATE_0}`;

                mockStorageGet = jest.fn(() => {
                    return `{"state":"${STATE_1}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
                });

                pkceAuthManager = getPKCEAuthManager();

                // Act/Assert
                return pkceAuthManager.getAccessToken(urlMock)
                    .then(() => {
                        done.fail('getAccessToken should not have succeeded.');
                    })
                    .catch(e => {
                        expect(e).toEqual(
                            new SplunkOAuthError('OAuth flow response state does not match request state'));
                        expect(mockStorageGet).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                        expect(mockStorageGet).toBeCalledTimes(1);
                        expect(mockStorageDelete).toBeCalledTimes(0);
                        done();
                    });
            });

        it('throws SplunkAuthClientError when unable to delete redirect parameters', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE_0}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${STATE_0}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });
            mockStorageDelete = jest.fn(() => {
                throw new Error(ERROR_MESSAGE);
            });

            mockAuthProxyAccessToken = jest.fn((): Promise<AccessTokenResponse> => {
                return Promise.resolve({
                    access_token: ACCESS_TOKEN,
                    expires_in: EXPIRES_IN,
                    id_token: 'idtoken',
                    refresh_token: 'refreshtoken',
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

        it('throws SplunkOAuthError when /token access token call fails', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE_0}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${STATE_0}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
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
                    expect(mockStorageDelete).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageDelete).toBeCalledTimes(1);
                    done();
                });
        });

        it('throws SplunkOAuthError when /token access token call fails due to unsigned TOS', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE_0}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${STATE_0}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
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

        it('returns AccessToken', async (done) => {
            // Arrange
            const urlMock = `https://url.com/?code=${CODE}&state=${STATE_0}&accept_tos=1`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${STATE_0}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });

            mockAuthProxyAccessToken = jest.fn((): Promise<AccessTokenResponse> => {
                return Promise.resolve({
                    access_token: ACCESS_TOKEN,
                    expires_in: EXPIRES_IN,
                    id_token: 'idtoken',
                    refresh_token: 'refreshtoken',
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
                    expect(mockStorageDelete).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageDelete).toBeCalledTimes(1);
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
                    'state=random&nonce=random&scope=openid%20email%20profile');
            expect(mockStorageSet)
                .toBeCalledWith(
                    JSON.stringify({
                        state: 'random',
                        codeVerifier: mockEncodedCodeVerifier,
                        codeChallenge: mockCodeChallenge
                    }),
                    REDIRECT_OAUTH_PARAMS_NAME);
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
                    'state=random&nonce=random&scope=openid%20email%20profile&customParam1=value1');
            expect(mockStorageSet)
                .toBeCalledWith(
                    JSON.stringify({
                        state: 'random',
                        codeVerifier: mockEncodedCodeVerifier,
                        codeChallenge: mockCodeChallenge
                    }),
                    REDIRECT_OAUTH_PARAMS_NAME);
            expect(mockStorageSet).toBeCalledTimes(1);
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
        });
    });

    describe('generateTosUrl', () => {
        it('generates the tos url', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return `{"state":"${STATE_0}","codeVerifier":"${CODE_VERIFIER}","codeChallenge":"${CODE_CHALLENGE}"}`;
            });
            pkceAuthManager = getPKCEAuthManager();

            // Act
            const result = pkceAuthManager.generateTosUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/tos?client_id=clientid&code_challenge=iamcodechallenge&' +
                    'code_challenge_method=S256&redirect_uri=https%3A%2F%2Fredirect.com&response_type=code&' +
                    'state=iamstate0&scope=openid%20email%20profile');
            expect(mockStorageGet).toBeCalledTimes(1);
        });
    });
});
