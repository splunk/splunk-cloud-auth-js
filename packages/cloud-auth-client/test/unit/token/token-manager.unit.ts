/* eslint-disable import/first */
/* eslint-disable @typescript-eslint/camelcase */
import { AccessToken } from '../../../src/model/access-token';
import { TokenManager, TokenManagerSettings } from '../../../src/token/token-manager';

const AUTH_HOST = 'host.com';
const AUTO_TOKEN_RENEWAL_BUFFER_0 = 0;
const AUTO_TOKEN_RENEWAL_BUFFER_10 = 10;
const CLIENT_ID = 'clientid';
const REDIRECT_URI = 'redirect.com';
const ACCESS_TOKEN = 'some-access-token';
const EXPIRES_AT = 1000;
const EXPIRES_IN = 100;
const TOKEN_TYPE = 'some-token-type';
const TOKEN_STORAGE_NAME = 'some-storage';

jest.useFakeTimers();

let mockStorageGet: jest.Mock;
let mockStorageClear: jest.Mock;
let mockStorageSet: jest.Mock;
jest.mock('../../../src/storage/storage-manager', () => {
    return {
        StorageManager: jest.fn().mockImplementation(() => {
            return {
                get: mockStorageGet,
                clear: mockStorageClear,
                set: mockStorageSet
            };
        })
    };
});

let mockAuthProxyAuthorizationToken: jest.Mock;
jest.mock('@splunkdev/cloud-auth-common', () => {
    return {
        AuthProxy: jest.fn().mockImplementation(() => {
            return {
                authorizationToken: mockAuthProxyAuthorizationToken
            };
        })
    };
});

jest.mock('../../../src/common/util', () => {
    return {
        generateRandomString: jest.fn()
            .mockReturnValueOnce('random1')
            .mockReturnValueOnce('random2')
            .mockReturnValueOnce('random1')
            .mockReturnValueOnce('random2')
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

describe('TokenManager', () => {
    let tokenManager: TokenManager;

    function getTokenManager(): TokenManager {
        return new TokenManager(
            new TokenManagerSettings(
                AUTH_HOST,
                AUTO_TOKEN_RENEWAL_BUFFER_0,
                CLIENT_ID,
                REDIRECT_URI
            )
        );
    }

    beforeEach(() => {
        mockStorageGet = jest.fn();
        mockStorageClear = jest.fn();
        mockStorageSet = jest.fn();
        mockAuthProxyAuthorizationToken = jest.fn();
        mockLoggerWarn = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('set', () => {
        it('with no autoTokenRenewalBuffer sets token in storage', () => {
            // Arrange
            const accessToken: AccessToken = {
                accessToken: ACCESS_TOKEN,
                expiresAt: EXPIRES_AT,
                expiresIn: EXPIRES_IN,
                tokenType: TOKEN_TYPE
            }

            tokenManager = getTokenManager();

            // Act
            tokenManager.set(accessToken);

            // Assert
            expect(mockStorageSet).toBeCalledWith(accessToken, 'accessToken');
            expect(mockStorageSet).toBeCalledTimes(1);
            expect(setTimeout).toBeCalledTimes(0);
            expect(clearTimeout).toBeCalledTimes(0);
        });

        it('with autoTokenRenewalBuffer sets token in storage', () => {
            // Arrange
            const accessToken: AccessToken = {
                accessToken: ACCESS_TOKEN,
                expiresAt: EXPIRES_AT,
                expiresIn: EXPIRES_IN,
                tokenType: TOKEN_TYPE
            }

            tokenManager = new TokenManager(
                new TokenManagerSettings(
                    AUTH_HOST,
                    AUTO_TOKEN_RENEWAL_BUFFER_10,
                    CLIENT_ID,
                    REDIRECT_URI,
                    TOKEN_STORAGE_NAME
                )
            );

            // Act
            tokenManager.set(accessToken);

            // Assert
            expect(mockStorageSet).toBeCalledWith(accessToken, 'accessToken');
            expect(mockStorageSet).toBeCalledTimes(1);
            expect(setTimeout)
                .toBeCalledWith(expect.anything(), (EXPIRES_IN - AUTO_TOKEN_RENEWAL_BUFFER_10) * 1000);
            expect(setTimeout).toBeCalledTimes(1);
            expect(clearTimeout).toBeCalledTimes(0);
        });
    });

    describe('get', () => {
        it('returns data from storage', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return 'access-token';
            });

            tokenManager = getTokenManager();

            // Act
            const result = tokenManager.get();

            // Assert
            expect(result).toEqual('access-token');
            expect(mockStorageGet).toBeCalledWith('accessToken');
            expect(mockStorageGet).toBeCalledTimes(1);
        });
    });

    describe('clear', () => {
        it('clears data in storage', () => {
            // Arrange
            tokenManager = getTokenManager();

            // Act
            tokenManager.clear();

            // Assert
            expect(mockStorageClear).toBeCalledWith();
            expect(mockStorageClear).toBeCalledTimes(1);
        });
    });

    describe('refresh', () => {
        it('sets token in storage', async () => {
            // Arrange
            mockAuthProxyAuthorizationToken = jest.fn(() => {
                return Promise.resolve({
                    access_token: 'access_token',
                    expires_in: 1000,
                    token_type: 'token_type'
                });
            });

            tokenManager = new TokenManager(
                new TokenManagerSettings(
                    AUTH_HOST,
                    0,
                    CLIENT_ID,
                    REDIRECT_URI
                )
            );

            // Act
            await tokenManager.refreshToken();

            // Assert
            expect(mockAuthProxyAuthorizationToken)
                .toBeCalledWith(
                    CLIENT_ID,
                    '',
                    'random1',
                    REDIRECT_URI,
                    'json',
                    'token id_token',
                    'openid email profile',
                    'random2');
            expect(mockAuthProxyAuthorizationToken).toBeCalledTimes(1);
            expect(mockStorageSet).toBeCalledWith({
                accessToken: 'access_token',
                expiresAt: 1000 + Math.floor(Date.now() / 1000),
                expiresIn: 1000,
                tokenType: 'token_type'
            }, 'accessToken');
            expect(mockStorageSet).toBeCalledTimes(1);
        });

        it('fails to set token in storage', async () => {
            // Arrange
            mockAuthProxyAuthorizationToken = jest.fn(() => {
                return Promise.reject(new Error('error message'));
            });

            tokenManager = new TokenManager(
                new TokenManagerSettings(
                    AUTH_HOST,
                    0,
                    CLIENT_ID,
                    REDIRECT_URI
                )
            );

            // Act
            await tokenManager.refreshToken();

            // Assert
            expect(mockAuthProxyAuthorizationToken)
                .toBeCalledWith(
                    CLIENT_ID,
                    '',
                    'random1',
                    REDIRECT_URI,
                    'json',
                    'token id_token',
                    'openid email profile',
                    'random2');
            expect(mockAuthProxyAuthorizationToken).toBeCalledTimes(1);
            expect(mockStorageSet).toBeCalledTimes(0);
        });
    });
});
