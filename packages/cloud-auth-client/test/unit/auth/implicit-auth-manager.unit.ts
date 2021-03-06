/* eslint-disable @typescript-eslint/camelcase */
import { ImplicitAuthManager, ImplicitAuthManagerSettings } from '../../../src/auth/implicit-auth-manager';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';
import { SplunkOAuthError } from '../../../src/error/splunk-oauth-error';
import { AccessToken } from '../../../src/model/access-token';

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
const SCOPES = 'scope-0 scope-1';

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

jest.mock('../../../src/common/util', () => {
    return {
        generateRandomString: jest.fn()
            .mockReturnValueOnce('random1')
            .mockReturnValueOnce('random2')
            .mockReturnValue('random'),
        clearWindowLocationFragments: jest.fn()
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

jest.mock('../../../src/validator/implicit-param-validators', () => {
    return {
        validateHashParameters: jest.fn(),
        validateOAuthParameters: jest.fn()
    };
});

describe('ImplictAuthManager', () => {
    let implicitAuthManager: ImplicitAuthManager;

    function getImplicitAuthManager(): ImplicitAuthManager {
        return new ImplicitAuthManager(
            new ImplicitAuthManagerSettings(
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

            implicitAuthManager = getImplicitAuthManager();

            // Act
            const result = implicitAuthManager.getRedirectPath();

            // Assert
            expect(result).toEqual('some-redirect');
            expect(mockStorageGet).toBeCalledWith(REDIRECT_PATH_PARAMS_NAME);
            expect(mockStorageGet).toBeCalledTimes(1);
        });
    });

    describe('setRedirectPath', () => {
        it('sets redirect path in storage', () => {
            // Arrange
            implicitAuthManager = getImplicitAuthManager();

            // Act
            implicitAuthManager.setRedirectPath('some-redirect');

            // Assert
            expect(mockStorageSet).toBeCalledWith('some-redirect', REDIRECT_PATH_PARAMS_NAME);
            expect(mockStorageSet).toBeCalledTimes(1);
        });
    });

    describe('deleteRedirectPath', () => {
        it('deletes redirect path from storage', () => {
            // Arrange
            implicitAuthManager = getImplicitAuthManager();

            // Act
            implicitAuthManager.deleteRedirectPath();

            // Assert
            expect(mockStorageDelete).toBeCalledWith(REDIRECT_PATH_PARAMS_NAME);
            expect(mockStorageDelete).toBeCalledTimes(1);
        });
    });

    describe('getAccessToken', () => {
        it('throws SplunkAuthClientError when there are no redirect params in storage', async (done) => {
            // Arrange
            const urlMock = `https://url.com/#access_token=${ACCESS_TOKEN}&expires_in=${EXPIRES_IN}&` +
                `token_type=${TOKEN_TYPE}`;

            mockStorageGet = jest.fn(() => {
                return undefined;
            });

            implicitAuthManager = getImplicitAuthManager();

            // Act/Assert
            return implicitAuthManager.getAccessToken(urlMock)
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

        it('throws SplunkOAuthError when hash parameter state and redirect parameters state are not equal',
            async (done) => {
                // Arrange
                const urlMock = `https://url.com/#access_token=${ACCESS_TOKEN}&expires_in=${EXPIRES_IN}&` +
                    `token_type=${TOKEN_TYPE}&state=${STATE_0}`;

                mockStorageGet = jest.fn(() => {
                    return `{"state":"${STATE_1}","scope":"${SCOPES}"}`;
                });

                implicitAuthManager = getImplicitAuthManager();

                // Act/Assert
                return implicitAuthManager.getAccessToken(urlMock)
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
            const urlMock = `https://url.com/#access_token=${ACCESS_TOKEN}&expires_in=${EXPIRES_IN}&` +
                `token_type=${TOKEN_TYPE}&state=${STATE_0}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${STATE_0}","scope":"${SCOPES}"}`;
            });
            mockStorageDelete = jest.fn(() => {
                throw new Error(ERROR_MESSAGE);
            });

            implicitAuthManager = getImplicitAuthManager();

            // Act/Assert
            return implicitAuthManager.getAccessToken(urlMock)
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
                    expect(mockStorageDelete).toBeCalledTimes(1);
                    done();
                });
        });

        it('returns AccessToken', async (done) => {
            // Arrange
            const urlMock = `https://url.com/#access_token=${ACCESS_TOKEN}&expires_in=${EXPIRES_IN}&` +
                `token_type=${TOKEN_TYPE}&state=${STATE_0}`;

            mockStorageGet = jest.fn(() => {
                return `{"state":"${STATE_0}","scope":"${SCOPES}"}`;
            });

            implicitAuthManager = getImplicitAuthManager();

            // Act/Assert
            return implicitAuthManager.getAccessToken(urlMock)
                .then((accessToken: AccessToken) => {
                    expect(accessToken.accessToken).toEqual(ACCESS_TOKEN);
                    expect(accessToken.expiresAt).toBeLessThanOrEqual(EXPIRES_IN + Math.floor(Date.now() / 1000));
                    expect(accessToken.expiresIn).toEqual(EXPIRES_IN);
                    expect(accessToken.tokenType).toEqual(TOKEN_TYPE);
                    expect(accessToken.scopes).toEqual(SCOPES.split(' '));
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
            implicitAuthManager = getImplicitAuthManager();

            // Act
            const result = implicitAuthManager.generateAuthUrl();

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/authorize?client_id=clientid&redirect_uri=https%3A%2F%2Fredirect.com&' +
                    'response_type=token%20id_token&state=random1&nonce=random2&scope=openid%20email%20profile');
            expect(mockStorageSet)
                .toBeCalledWith(
                    JSON.stringify({
                        state: 'random1',
                        scope: 'openid email profile'
                    }),
                    REDIRECT_OAUTH_PARAMS_NAME);
            expect(mockStorageSet).toBeCalledTimes(1);
        });

        it('with additional query params generates auth URL', () => {
            // Arrange
            implicitAuthManager = getImplicitAuthManager();
            const map = new Map([
                ['customParam1', 'value1'],
                ['customParam2', undefined],
                ['customParam2', null],
            ]);

            // Act
            const result = implicitAuthManager.generateAuthUrl(map);

            // Assert
            expect(result).not.toBeNull();
            expect(result.href)
                .toEqual('https://host.com/authorize?client_id=clientid&redirect_uri=https%3A%2F%2Fredirect.com&' +
                    'response_type=token%20id_token&state=random&nonce=random&scope=openid%20email%20profile&' +
                    'customParam1=value1');
            expect(mockStorageSet)
                .toBeCalledWith(
                    JSON.stringify({
                        state: 'random',
                        scope: 'openid email profile'
                    }),
                    REDIRECT_OAUTH_PARAMS_NAME);
            expect(mockStorageSet).toBeCalledTimes(1);
        });
    });

    describe('generateLogoutUrl', () => {
        it('deletes redirect path from storage', () => {
            // Arrange
            implicitAuthManager = getImplicitAuthManager();

            // Act
            const result = implicitAuthManager.generateLogoutUrl(REDIRECT_URI);

            // Assert
            expect(result).not.toBeNull();
            expect(result.href).toEqual('https://host.com/logout?redirect_uri=https%3A%2F%2Fredirect.com');
        });
    });
});
