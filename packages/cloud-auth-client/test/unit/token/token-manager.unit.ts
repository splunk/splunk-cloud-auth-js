/* eslint-disable import/first */
/* eslint-disable @typescript-eslint/camelcase */
import { AccessToken } from '../../../src/model/access-token';
import { GrantType } from '../../../src/splunk-auth-client-settings';
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
const TENANT = 'testtenant';

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
let mockAuthProxyRefreshAccessToken: jest.Mock
jest.mock('@splunkdev/cloud-auth-common', () => {
    return {
        AuthProxy: jest.fn().mockImplementation(() => {
            return {
                authorizationToken: mockAuthProxyAuthorizationToken,
                refreshAccessToken: mockAuthProxyRefreshAccessToken
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

    function getTokenManager(autoRenewalBuffer?: number): TokenManager {
        let buffer = autoRenewalBuffer;

        if (!buffer) {
            buffer = AUTO_TOKEN_RENEWAL_BUFFER_0
        }
        return new TokenManager(
            new TokenManagerSettings(
                GrantType.PKCE,
                AUTH_HOST,
                buffer,
                CLIENT_ID,
                REDIRECT_URI,
                TOKEN_STORAGE_NAME
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
        it('with no autoTokenRenewalBuffer sets global token in storage', () => {
            // Arrange
            const accessToken: AccessToken = {
                accessToken: ACCESS_TOKEN,
                expiresAt: EXPIRES_AT,
                expiresIn: EXPIRES_IN,
                tokenType: TOKEN_TYPE
            }

            tokenManager = getTokenManager(AUTO_TOKEN_RENEWAL_BUFFER_0);

            // Act
            tokenManager.set(accessToken);

            // Assert
            expect(mockStorageSet).toBeCalledWith(accessToken, 'global');
            expect(mockStorageSet).toBeCalledTimes(1);
            expect(setTimeout).toBeCalledTimes(0);
            expect(clearTimeout).toBeCalledTimes(0);
        });

        it('with autoTokenRenewalBuffer sets global token in storage', () => {
            // Arrange
            const accessToken: AccessToken = {
                accessToken: ACCESS_TOKEN,
                expiresAt: EXPIRES_AT,
                expiresIn: EXPIRES_IN,
                tokenType: TOKEN_TYPE
            }

            tokenManager = getTokenManager(AUTO_TOKEN_RENEWAL_BUFFER_10);

            // Act
            tokenManager.set(accessToken);

            // Assert
            expect(mockStorageSet).toBeCalledWith(accessToken, 'global');
            expect(mockStorageSet).toBeCalledTimes(1);
            expect(setTimeout)
                .toBeCalledWith(expect.anything(), (EXPIRES_IN - AUTO_TOKEN_RENEWAL_BUFFER_10) * 1000);
            expect(setTimeout).toBeCalledTimes(1);
            expect(clearTimeout).toBeCalledTimes(0);
        });

        it('with tenant sets tenant-scoped token in storage', () => {
            // Arrange
            const accessToken: AccessToken = {
                accessToken: ACCESS_TOKEN,
                expiresAt: EXPIRES_AT,
                expiresIn: EXPIRES_IN,
                tokenType: TOKEN_TYPE,
                tenant: TENANT
            }

            tokenManager = getTokenManager(AUTO_TOKEN_RENEWAL_BUFFER_10);

            // Act
            tokenManager.set(accessToken);

            // Assert
            expect(mockStorageGet).toBeCalledWith('tenant');
            expect(mockStorageGet).toBeCalledTimes(1);

            const tenantAccessToken = {};
            tenantAccessToken[TENANT] = accessToken;
            expect(mockStorageSet).toBeCalledWith(tenantAccessToken, 'tenant');
            expect(mockStorageSet).toBeCalledTimes(1);

            expect(setTimeout).toBeCalledTimes(1);
            expect(clearTimeout).toBeCalledTimes(0);
        });
    });

    describe('get', () => {
        it('returns the global access token from storage', () => {
            // Arrange
            const globalAccessToken = { 'accessToken': 'global-access-token' }
            const tenantAccessToken = { 'accessToken': 'tenant-access-token' }
            const accessTokenStorage = {
                'global': globalAccessToken,
                'tenant': {
                    'testtenant': tenantAccessToken
                }
            }
            mockStorageGet = jest.fn((key) => {
                return accessTokenStorage[key];
            });

            tokenManager = getTokenManager();

            // Act
            const result = tokenManager.get('');

            // Assert
            expect(result).toEqual(globalAccessToken);
            expect(mockStorageGet).toBeCalledWith('global');
            expect(mockStorageGet).toBeCalledTimes(1);
        });

        it('returns the tenant-scoped access token from storage', () => {
            // Arrange
            const globalAccessToken = { 'accessToken': 'global-access-token' }
            const tenantAccessToken = { 'accessToken': 'tenant-access-token' }
            const otherTenantAccessToken = { 'accessToken': 'other-tenant-access-token' }
            const accessTokenStorage = {
                'global': globalAccessToken,
                'tenant': {
                    'testtenant': tenantAccessToken,
                    'othertenant': otherTenantAccessToken,
                }
            }
            mockStorageGet = jest.fn((key) => {
                return accessTokenStorage[key];
            });

            tokenManager = getTokenManager(AUTO_TOKEN_RENEWAL_BUFFER_10);

            // Act
            const result = tokenManager.get('testtenant');

            // Assert
            expect(result).toEqual(tenantAccessToken);
            expect(mockStorageGet).toBeCalledWith('tenant');
            expect(mockStorageGet).toBeCalledTimes(2);
        });

        it('returns the global access token if tenant-scoped access token is not found in storage', () => {
            // Arrange
            const globalAccessToken = { 'accessToken': 'global-access-token' }
            const tenantAccessToken = { 'accessToken': 'tenant-access-token' }
            const accessTokenStorage = {
                'global': globalAccessToken,
                'tenant': {
                    'othertenant': tenantAccessToken,
                }
            }
            mockStorageGet = jest.fn((key) => {
                return accessTokenStorage[key];
            });

            tokenManager = getTokenManager(AUTO_TOKEN_RENEWAL_BUFFER_10);

            // Act
            const result = tokenManager.get('testtenant');

            // Assert
            expect(result).toEqual(globalAccessToken);
            expect(mockStorageGet).toBeCalledWith('global');
            expect(mockStorageGet).toBeCalledWith('tenant');
            expect(mockStorageGet).toBeCalledTimes(2);
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
        it('sets token in storage for pkce request', async () => {
            // Arrange
            const oldAccessToken = {
                accessToken: 'old_access_token',
                expiresAt: 1000,
                expiresIn: 1000,
                tokenType: TOKEN_TYPE,
                refreshToken: 'refresh_access_token',
                tenant: TENANT
            };

            const refreshedAccessToken = {
                access_token: 'access_token',
                expires_in: 1000,
                refresh_token: 'refresh_access_token',
                token_type: TOKEN_TYPE
            };

            const tenantAccessToken = {};
            tenantAccessToken[TENANT] = {
                accessToken: refreshedAccessToken.access_token,
                expiresAt: refreshedAccessToken.expires_in + Math.floor(Date.now() / 1000),
                expiresIn: refreshedAccessToken.expires_in,
                tokenType: refreshedAccessToken.token_type,
                refreshToken: refreshedAccessToken.refresh_token,
                tenant: TENANT
            };

            mockAuthProxyRefreshAccessToken = jest.fn(() => {
                return Promise.resolve(refreshedAccessToken);
            });

            tokenManager = getTokenManager();

            // Act
            await tokenManager.refreshToken(oldAccessToken);

            // Assert
            expect(mockAuthProxyRefreshAccessToken)
                .toBeCalledWith(
                    CLIENT_ID,
                    'refresh_token',
                    'openid email profile offline_access',
                    oldAccessToken.refreshToken,
                    TENANT
                );
            expect(mockAuthProxyRefreshAccessToken).toBeCalledTimes(1);
            expect(mockStorageSet).toBeCalledWith(tenantAccessToken, 'tenant');
            expect(mockStorageSet).toBeCalledTimes(1);
        });

        it('sets token in storage for implicit request', async () => {
            // Arrange
            const oldAccessToken = {
                accessToken: 'old_access_token',
                expiresAt: 1000,
                expiresIn: 1000,
                tokenType: TOKEN_TYPE
            };

            const refreshedAccessToken = {
                access_token: 'access_token',
                expires_in: 1000,
                token_type: TOKEN_TYPE
            };

            const globalAccessToken = {
                accessToken: refreshedAccessToken.access_token,
                expiresAt: refreshedAccessToken.expires_in + Math.floor(Date.now() / 1000),
                expiresIn: refreshedAccessToken.expires_in,
                tokenType: TOKEN_TYPE
            }

            mockAuthProxyAuthorizationToken = jest.fn(() => {
                return Promise.resolve(refreshedAccessToken);
            });

            tokenManager = new TokenManager(
                new TokenManagerSettings(
                    GrantType.IMPLICIT,
                    AUTH_HOST,
                    AUTO_TOKEN_RENEWAL_BUFFER_10,
                    CLIENT_ID,
                    REDIRECT_URI,
                    TOKEN_STORAGE_NAME
                )
            );

            // Act
            await tokenManager.refreshToken(oldAccessToken);

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
            expect(mockStorageSet).toBeCalledWith(globalAccessToken, 'global');
            expect(mockStorageSet).toBeCalledTimes(1);
        });

        it('fails to set token in storage for pkce request', async () => {
            // Arrange
            const oldAccessToken = {
                accessToken: 'old_access_token',
                expiresAt: 1000,
                expiresIn: 1000,
                tokenType: TOKEN_TYPE,
                refreshToken: 'refresh_access_token',
                tenant: TENANT
            };

            mockAuthProxyRefreshAccessToken = jest.fn(() => {
                return Promise.reject(new Error('error message'));
            });

            tokenManager = getTokenManager();

            // Act
            await tokenManager.refreshToken(oldAccessToken);

            // Assert
            expect(mockAuthProxyRefreshAccessToken)
                .toBeCalledWith(
                    CLIENT_ID,
                    'refresh_token',
                    'openid email profile offline_access',
                    oldAccessToken.refreshToken,
                    TENANT
                );
            expect(mockAuthProxyRefreshAccessToken).toBeCalledTimes(1);
            expect(mockStorageSet).toBeCalledTimes(0);
        });

        it('fails to set token in storage for implicit request', async () => {
            // Arrange
            const oldAccessToken = {
                accessToken: 'old_access_token',
                expiresAt: 1000,
                expiresIn: 1000,
                tokenType: TOKEN_TYPE
            };

            mockAuthProxyAuthorizationToken = jest.fn(() => {
                return Promise.reject(new Error('error message'));
            });

            tokenManager = new TokenManager(
                new TokenManagerSettings(
                    GrantType.IMPLICIT,
                    AUTH_HOST,
                    AUTO_TOKEN_RENEWAL_BUFFER_10,
                    CLIENT_ID,
                    REDIRECT_URI,
                    TOKEN_STORAGE_NAME
                )
            );

            // Act
            await tokenManager.refreshToken(oldAccessToken);

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
