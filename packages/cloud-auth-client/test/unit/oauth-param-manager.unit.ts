/* eslint-disable @typescript-eslint/camelcase */
import { SplunkAuthClientError } from '../../src/error/splunk-auth-client-error';
import { SplunkOAuthError } from '../../src/error/splunk-oauth-error';
import { OAuthParamManager, OAuthParamManagerSettings } from '../../src/oauth-param-manager';
import { AccessToken } from '../../src/token-manager';

const AUTH_HOST = 'https://host.com';
const CLIENT_ID = 'clientid';
const REDIRECT_URI = 'https://redirect.com';
const REDIRECT_PARAMS_STORAGE_NAME = 'some-storage';
const REDIRECT_PATH_PARAMS_NAME = 'redirect-path';
const REDIRECT_OAUTH_PARAMS_NAME = 'redirect-oauth-params';
const STATE_0 = 'qwerty12345';
const STATE_1 = 'asdf09876';
const ERROR_MESSAGE = 'an error';
const EXPIRES_IN = 1000;
const ACCESS_TOKEN = 'abcd';
const TOKEN_TYPE = 'token-type';
const SCOPES = 'scope';

jest.useFakeTimers();

let mockStorageGet: jest.Mock;
let mockStorageSet: jest.Mock;
let mockStorageDelete: jest.Mock;
jest.mock('../../src/storage/storage-manager', () => {
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

jest.mock('../../src/common/util', () => {
    return {
        generateRandomString: jest.fn()
            .mockReturnValueOnce('random1')
            .mockReturnValueOnce('random2')
            .mockReturnValue('random'),
        removeWindowLocationHash: jest.fn()
    };
});

let mockLoggerWarn: jest.Mock;
jest.mock('../../src/common/logger', () => ({
    Logger: class {
        public static warn(message: string): void {
            mockLoggerWarn(message);
        }
    }
}));

describe('OAuthParamManager', () => {
    let oauthParamManager: OAuthParamManager;

    function getOAuthParamManager(): OAuthParamManager {
        return new OAuthParamManager(
            new OAuthParamManagerSettings(
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

            oauthParamManager = getOAuthParamManager();

            // Act
            const result = oauthParamManager.getRedirectPath();

            // Assert
            expect(result).toEqual('some-redirect');
            expect(mockStorageGet).toBeCalledWith(REDIRECT_PATH_PARAMS_NAME);
            expect(mockStorageGet).toBeCalledTimes(1);
        });
    });

    describe('setRedirectPath', () => {
        it('sets redirect path in storage', () => {
            // Arrange
            oauthParamManager = getOAuthParamManager();

            // Act
            oauthParamManager.setRedirectPath('some-redirect');

            // Assert
            expect(mockStorageSet).toBeCalledWith('some-redirect', REDIRECT_PATH_PARAMS_NAME);
            expect(mockStorageSet).toBeCalledTimes(1);
        });
    });

    describe('deleteRedirectPath', () => {
        it('deletes redirect path from storage', () => {
            // Arrange
            oauthParamManager = getOAuthParamManager();

            // Act
            oauthParamManager.deleteRedirectPath();

            // Assert
            expect(mockStorageDelete).toBeCalledWith(REDIRECT_PATH_PARAMS_NAME);
            expect(mockStorageDelete).toBeCalledTimes(1);
        });
    });

    describe('getAccessTokenFromUrl', () => {
        it('throws SplunkAuthClientError when hash parameters does not contain access_token', async (done) => {
            // Arrange
            const urlMock = 'https://url.com/#param=value';
            oauthParamManager = getOAuthParamManager();

            // Act/Assert
            return oauthParamManager.getAccessTokenFromUrl(urlMock)
                .then(() => {
                    done.fail();
                })
                .catch(e => {
                    expect(e).toEqual(new SplunkAuthClientError('Unable to parse a token from the url'));
                    expect(mockStorageGet).toBeCalledTimes(0);
                    done();
                });
        });

        it('throws SplunkAuthClientError when hash parameters does not contain expires_in', async (done) => {
            // Arrange
            const urlMock = `https://url.com/#access_token=${ACCESS_TOKEN}`;
            oauthParamManager = getOAuthParamManager();

            // Act/Assert
            return oauthParamManager.getAccessTokenFromUrl(urlMock)
                .then(() => {
                    done.fail();
                })
                .catch(e => {
                    expect(e).toEqual(new SplunkAuthClientError('Unable to parse a token from the url'));
                    expect(mockStorageGet).toBeCalledTimes(0);
                    done();
                });
        });

        it('throws SplunkAuthClientError when hash parameters does not contain token_type', async (done) => {
            // Arrange
            const urlMock = `https://url.com/#access_token=${ACCESS_TOKEN}&expires_in=${EXPIRES_IN}`;
            oauthParamManager = getOAuthParamManager();

            // Act/Assert
            return oauthParamManager.getAccessTokenFromUrl(urlMock)
                .then(() => {
                    done.fail();
                })
                .catch(e => {
                    expect(e).toEqual(new SplunkAuthClientError('Unable to parse a token from the url'));
                    expect(mockStorageGet).toBeCalledTimes(0);
                    done();
                });
        });

        it('throws SplunkOAuthError when hash parameters contains error', async (done) => {
            // Arrange
            const urlMock = `https://url.com/#access_token=${ACCESS_TOKEN}&expires_in=${EXPIRES_IN}&` +
                `token_type=${TOKEN_TYPE}&error=an%20error&error_description=a%20description`;
            oauthParamManager = getOAuthParamManager();

            // Act/Assert
            return oauthParamManager.getAccessTokenFromUrl(urlMock)
                .then(() => {
                    done.fail();
                })
                .catch(e => {
                    expect(e).toEqual(new SplunkOAuthError('a description', 'an error'));
                    expect(mockStorageGet).toBeCalledTimes(0);
                    expect(mockStorageDelete).toBeCalledTimes(0);
                    done();
                });
        });

        it('throws SplunkAuthClientError when there are no redirect params in storage', async (done) => {
            // Arrange
            const urlMock = `https://url.com/#access_token=${ACCESS_TOKEN}&expires_in=${EXPIRES_IN}&` +
                `token_type=${TOKEN_TYPE}`;

            mockStorageGet = jest.fn(() => {
                return undefined;
            });

            oauthParamManager = getOAuthParamManager();

            // Act/Assert
            return oauthParamManager.getAccessTokenFromUrl(urlMock)
                .then(() => {
                    done.fail();
                })
                .catch(e => {
                    expect(e).toEqual(new SplunkAuthClientError('Unable to retrieve OAuth redirect params storage'));
                    expect(mockStorageGet).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageGet).toBeCalledTimes(1);
                    expect(mockStorageDelete).toBeCalledTimes(0);
                    done();
                });
        });

        it('throws SplunkAuthClientError when hash parameter state and redirect parameters state are not equal',
            async (done) => {
                // Arrange
                const urlMock = `https://url.com/#access_token=${ACCESS_TOKEN}&expires_in=${EXPIRES_IN}&` +
                    `token_type=${TOKEN_TYPE}&state=${STATE_0}`;

                mockStorageGet = jest.fn(() => {
                    return `{"state":"${STATE_1}"}`;
                });

                oauthParamManager = getOAuthParamManager();

                // Act/Assert
                return oauthParamManager.getAccessTokenFromUrl(urlMock)
                    .then(() => {
                        done.fail();
                    })
                    .catch(e => {
                        expect(e).toEqual(
                            new SplunkAuthClientError('OAuth flow response state does not match request state'));
                        expect(mockStorageGet).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                        expect(mockStorageGet).toBeCalledTimes(1);
                        expect(mockStorageDelete).toBeCalledTimes(0);
                        done();
                    });
            });

        it('throws SplunkAuthClientError when unable to delete redirect parameters', async (done) => {
            // Arrange
            const urlMock = `https://url.com/#access_token=${ACCESS_TOKEN}&expires_in=${EXPIRES_IN}&` +
                `token_type=${TOKEN_TYPE}&state=${STATE_0}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${STATE_0}"}`;
            });
            mockStorageDelete = jest.fn(() => {
                throw new Error(ERROR_MESSAGE);
            });

            oauthParamManager = getOAuthParamManager();

            // Act/Assert
            return oauthParamManager.getAccessTokenFromUrl(urlMock)
                .then(() => {
                    done.fail();
                })
                .catch(e => {
                    expect(e).toEqual(
                        new SplunkAuthClientError(
                            `Failed to remove the ${REDIRECT_OAUTH_PARAMS_NAME} data. ${ERROR_MESSAGE}`));
                    expect(mockStorageGet).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageGet).toBeCalledTimes(1);
                    expect(mockStorageDelete).toBeCalledWith(REDIRECT_OAUTH_PARAMS_NAME);
                    expect(mockStorageDelete).toBeCalledTimes(1);
                    done();
                });
        });

        it('returns AccessToken', async (done) => {
            // Arrange
            const urlMock = `https://url.com/#access_token=${ACCESS_TOKEN}&expires_in=${EXPIRES_IN}&` +
                `token_type=${TOKEN_TYPE}&state=${STATE_0}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${STATE_0}","scopes":"${SCOPES}"}`;
            });

            oauthParamManager = getOAuthParamManager();

            // Act/Assert
            return oauthParamManager.getAccessTokenFromUrl(urlMock)
                .then((accessToken: AccessToken) => {
                    expect(accessToken.accessToken).toEqual(ACCESS_TOKEN);
                    expect(accessToken.expiresAt).toBeGreaterThanOrEqual(EXPIRES_IN + Math.floor(Date.now() / 1000));
                    expect(accessToken.expiresIn).toEqual(EXPIRES_IN);
                    expect(accessToken.tokenType).toEqual(TOKEN_TYPE);
                    expect(accessToken.scopes).toEqual(SCOPES);
                    done();
                })
                .catch(() => {
                    done.fail();
                });
        });
    });

    describe('generateAuthUrl', () => {
        it('without additional query params generates auth URL', () => {
            // Arrange
            oauthParamManager = getOAuthParamManager();

            // Act
            const result = oauthParamManager.generateAuthUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/authorize?client_id=clientid&redirect_uri=https%3A%2F%2Fredirect.com&' +
                    'response_type=token%20id_token&state=random1&nonce=random2&scope=openid%20email%20profile&');
            expect(mockStorageSet)
                .toBeCalledWith(
                    JSON.stringify({
                        responseType: 'token id_token',
                        state: 'random1',
                        nonce: 'random2',
                        scopes: 'openid email profile',
                        clientId: CLIENT_ID
                    }),
                    REDIRECT_OAUTH_PARAMS_NAME);
            expect(mockStorageSet).toBeCalledTimes(1);
        });

        it('with additional query params generates auth URL', () => {
            // Arrange
            oauthParamManager = getOAuthParamManager();
            const map = new Map([
                ['customParam1', 'value1'],
                ['customParam2', undefined],
                ['customParam2', null],
            ]);

            // Act
            const result = oauthParamManager.generateAuthUrl(map);

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/authorize?client_id=clientid&redirect_uri=https%3A%2F%2Fredirect.com&' +
                    'response_type=token%20id_token&state=random&nonce=random&scope=openid%20email%20profile&' +
                    'customParam1=value1&');
            expect(mockStorageSet)
                .toBeCalledWith(
                    JSON.stringify({
                        responseType: 'token id_token',
                        state: 'random',
                        nonce: 'random',
                        scopes: 'openid email profile',
                        clientId: CLIENT_ID
                    }),
                    REDIRECT_OAUTH_PARAMS_NAME);
            expect(mockStorageSet).toBeCalledTimes(1);
        });
    });

    describe('generateLogoutUrl', () => {
        it('deletes redirect path from storage', () => {
            // Arrange
            oauthParamManager = getOAuthParamManager();

            // Act
            const result = oauthParamManager.generateLogoutUrl(REDIRECT_URI);

            // Assert
            expect(result).not.toBeNull();
            expect(result.href).toEqual('https://host.com/logout?redirect_uri=https%253A%252F%252Fredirect.com');
        });
    });
});
