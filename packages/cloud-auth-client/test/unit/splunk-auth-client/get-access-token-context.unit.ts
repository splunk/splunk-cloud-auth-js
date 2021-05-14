import { AuthManager } from '../../../src/auth/auth-manager';
import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { SplunkOAuthError } from '../../../src/error/splunk-oauth-error';
import { AccessToken } from '../../../src/model/access-token';
import { SplunkAuthClient } from '../../../src/splunk-auth-client';
import { GrantType, SplunkAuthClientSettings } from '../../../src/splunk-auth-client-settings';
import { mockWindowProperty } from '../fixture/test-setup';

const GRANT_TYPE_IMPLICIT = GrantType.IMPLICIT;
const GRANT_TYPE_PKCE = GrantType.PKCE;
const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';
const URL_0 = new URL('https://newurl.com');

jest.useFakeTimers();

let mockStorageGet: jest.Mock;
let mockStorageSet: jest.Mock;
let mockStorageClear: jest.Mock;
jest.mock('../../../src/token/token-manager', () => {
    return {
        TokenManager: jest.fn().mockImplementation(() => {
            return {
                clear: mockStorageClear,
                get: mockStorageGet,
                set: mockStorageSet,
            };
        }),
        TokenManagerSettings: jest.fn().mockImplementation(),
    };
});

let mockLoggerWarn: jest.Mock;
jest.mock('../../../src/common/logger', () => ({
    Logger: class {
        public static warn(message: string): void {
            mockLoggerWarn(message);
        }
    },
}));

jest.mock('../../../src/common/util', () => {
    return {
        clearWindowLocationFragments: jest.fn(),
    };
});

describe('SplunkAuthClient', () => {
    const accessToken: AccessToken = {
        accessToken: 'abc',
        expiresAt: Number.MAX_VALUE,
        expiresIn: 10,
        tokenType: 'token-type',
    };
    const invalidAccessToken: AccessToken = {
        accessToken: 'abc',
        expiresAt: 1,
        expiresIn: 10,
        tokenType: 'token-type',
    };

    let mockAuthManager: AuthManager;
    let mockGetAccessToken: jest.Mock;
    let mockGenerateAuthUrl: jest.Mock;
    let mockDeleteRedirectPath: jest.Mock;
    let mockGetRedirectPath: jest.Mock;
    let mockGenerateTosUrl: jest.Mock;

    function getAuthClient(): SplunkAuthClient {
        return new SplunkAuthClient(
            new SplunkAuthClientSettings(GRANT_TYPE_IMPLICIT, CLIENT_ID, REDIRECT_URI)
        );
    }

    mockWindowProperty('location', {
        href: '',
    });

    beforeEach(() => {
        mockStorageGet = jest.fn();
        mockStorageSet = jest.fn();
        mockStorageClear = jest.fn();
        mockLoggerWarn = jest.fn();
        jest.spyOn(AuthManagerFactory, 'get').mockImplementation(() => {
            return mockAuthManager;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAccessTokenContext', () => {
        describe('with passing token validation', () => {
            it('returns AccessToken', async () => {
                // Arrange
                mockStorageGet = jest.fn(
                    (): AccessToken => {
                        return accessToken;
                    }
                );
                mockGetAccessToken = jest.fn();
                mockGenerateAuthUrl = jest.fn();
                mockLoggerWarn = jest.fn();
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: mockGetAccessToken,
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn(),
                    getUserStateParameter: jest.fn(),
                };

                const authClient = getAuthClient();

                // Act
                const result = await authClient.getAccessTokenContext();

                // Assert
                expect(result).toEqual(accessToken);
                expect(mockStorageGet).toBeCalledTimes(2);
                expect(mockGenerateAuthUrl).toBeCalledTimes(0);
            });

            it('returns AccessToken and restores path when restorePathAfterLogin set to true', async () => {
                // Arrange
                const restoredPath = '/restored/path';
                mockStorageGet = jest.fn(
                    (): AccessToken => {
                        return accessToken;
                    }
                );
                mockGetAccessToken = jest.fn();
                mockGetRedirectPath = jest.fn((): string => {
                    return restoredPath;
                });
                mockDeleteRedirectPath = jest.fn();
                mockGenerateAuthUrl = jest.fn();
                mockLoggerWarn = jest.fn();
                mockAuthManager = {
                    getRedirectPath: mockGetRedirectPath,
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: mockDeleteRedirectPath,
                    getAccessToken: mockGetAccessToken,
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn(),
                    getUserStateParameter: jest.fn(),
                };

                const settings = new SplunkAuthClientSettings(GRANT_TYPE_IMPLICIT, CLIENT_ID, REDIRECT_URI);
                settings.restorePathAfterLogin = true;
                const authClient = new SplunkAuthClient(settings);

                // Act
                const result0 = await authClient.getAccessTokenContext();
                const result1 = await authClient.getAccessTokenContext();

                // Assert
                expect(result0).toEqual(accessToken);
                expect(result1).toEqual(accessToken);
                expect(mockStorageGet).toBeCalledTimes(4);
                expect(mockGetRedirectPath).toBeCalledTimes(1);
                expect(mockDeleteRedirectPath).toBeCalledTimes(1);
                expect(mockGenerateAuthUrl).toBeCalledTimes(0);
            });
        });

        describe('with failed token validation', () => {
            it('throws error when request for token fails and autoRedirectToLogin set to false', async (done) => {
                // Arrange
                mockStorageGet = jest
                    .fn()
                    .mockImplementationOnce(
                        (): AccessToken => {
                            return invalidAccessToken;
                        }
                    )
                    .mockImplementationOnce(
                        (): AccessToken => {
                            return undefined;
                        }
                    );
                const error = new Error('getaccesstoken failure');
                mockGetAccessToken = jest.fn(() => {
                    throw error;
                });
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: mockGetAccessToken,
                    generateAuthUrl: jest.fn(),
                    generateLogoutUrl: jest.fn(),
                    getUserStateParameter: jest.fn(),
                };

                const settings = new SplunkAuthClientSettings(GRANT_TYPE_IMPLICIT, CLIENT_ID, REDIRECT_URI);
                settings.autoRedirectToLogin = false;
                const authClient = new SplunkAuthClient(settings);

                // Act
                await authClient
                    .getAccessTokenContext()
                    .then(() => {
                        done.fail();
                    })
                    .catch((e) => {
                        // Assert
                        expect(e).toEqual(error);
                        expect(mockStorageGet).toBeCalledTimes(1);
                        expect(mockStorageClear).toBeCalledTimes(1);
                        expect(mockGetAccessToken).toBeCalledTimes(1);
                        expect(mockGenerateAuthUrl).toBeCalledTimes(0);
                        done();
                    });
            });

            it('redirects to login when request for token fails and autoRedirectToLogin set to true', async (done) => {
                // Arrange
                mockStorageGet = jest
                    .fn()
                    .mockImplementationOnce(
                        (): AccessToken => {
                            return invalidAccessToken;
                        }
                    )
                    .mockImplementationOnce(
                        (): AccessToken => {
                            return accessToken;
                        }
                    );
                mockGetAccessToken = jest.fn(
                    (): AccessToken => {
                        throw new SplunkOAuthError('error', 'token_not_found');
                    }
                );
                mockGenerateAuthUrl = jest.fn(() => {
                    return URL_0;
                });
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: mockGetAccessToken,
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn(),
                    getUserStateParameter: jest.fn(),
                };

                const settings = new SplunkAuthClientSettings(GRANT_TYPE_IMPLICIT, CLIENT_ID, REDIRECT_URI);
                settings.restorePathAfterLogin = true;
                const authClient = new SplunkAuthClient(settings);

                // Act
                const result = await authClient.getAccessTokenContext().catch((e) => {
                    done.fail(e);
                });

                // Assert
                expect(result).toBeUndefined();
                expect(mockStorageGet).toBeCalledTimes(1);
                expect(mockStorageClear).toBeCalledTimes(0);
                expect(mockGetAccessToken).toBeCalledTimes(1);
                expect(mockGenerateAuthUrl).toBeCalledTimes(1);

                done();
            });

            it('returns valid global AccessToken after failed token validation and successful retrieval of a new token', async () => {
                // Arrange
                mockStorageGet = jest
                    .fn()
                    .mockImplementationOnce(
                        (): AccessToken => {
                            return invalidAccessToken;
                        }
                    )
                    .mockImplementationOnce(
                        (): AccessToken => {
                            return accessToken;
                        }
                    );
                mockGenerateAuthUrl = jest.fn(() => {
                    return URL_0;
                });
                mockGetAccessToken = jest.fn(() => {
                    return new Promise((resolve) => resolve(accessToken));
                });
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: mockGetAccessToken,
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn(),
                    getUserStateParameter: jest.fn(),
                };

                const settings = new SplunkAuthClientSettings(GRANT_TYPE_IMPLICIT, CLIENT_ID, REDIRECT_URI);
                const authClient = new SplunkAuthClient(settings);

                // Act
                const result = await authClient.getAccessTokenContext();

                // Assert
                expect(result).toEqual(accessToken);
                expect(mockStorageGet).toBeCalledWith('');
                expect(mockStorageGet).toBeCalledTimes(2);
                expect(mockStorageSet).toBeCalledTimes(1);
                expect(mockGetAccessToken).toBeCalledTimes(1);
                expect(mockGenerateAuthUrl).toBeCalledTimes(0);
            });

            it('returns valid tenant-scoped AccessToken after failed token validation and successful retrieval of a new token', async () => {
                // Arrange
                const tenantAccessToken = accessToken
                tenantAccessToken.tenant = 'testtenant';

                mockStorageGet = jest
                    .fn()
                    .mockImplementationOnce(
                        (): AccessToken => {
                            return invalidAccessToken;
                        }
                    )
                    .mockImplementationOnce(
                        (): AccessToken => {
                            return tenantAccessToken;
                        }
                    );
                mockGenerateAuthUrl = jest.fn(() => {
                    return URL_0;
                });
                mockGetAccessToken = jest.fn(() => {
                    return new Promise((resolve) => resolve(tenantAccessToken));
                });
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: mockGetAccessToken,
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn(),
                    getUserStateParameter: jest.fn(),
                };

                const settings = new SplunkAuthClientSettings(GRANT_TYPE_PKCE, CLIENT_ID, REDIRECT_URI);
                const authClient = new SplunkAuthClient(settings);

                // Act
                const result = await authClient.getAccessTokenContext();

                // Assert
                expect(result).toEqual(tenantAccessToken);
                expect(mockStorageGet).toBeCalledWith(tenantAccessToken.tenant);
                expect(mockStorageGet).toBeCalledTimes(2);
                expect(mockStorageSet).toBeCalledTimes(1);
                expect(mockGetAccessToken).toBeCalledTimes(1);
                expect(mockGenerateAuthUrl).toBeCalledTimes(0);
            });
        });

        it('redirects to tos when request for token fails due to unsigned tos and grant type is PKCE', async (done) => {
            // Arrange
            mockStorageGet = jest
                .fn()
                .mockImplementationOnce(
                    (): AccessToken => {
                        return invalidAccessToken;
                    }
                )
                .mockImplementationOnce(
                    (): AccessToken => {
                        return accessToken;
                    }
                );
            mockGetAccessToken = jest.fn(
                (): AccessToken => {
                    throw new SplunkOAuthError('error', 'unsignedtos');
                }
            );
            mockGenerateTosUrl = jest.fn(() => {
                return URL_0;
            });
            mockAuthManager = {
                getRedirectPath: jest.fn(),
                setRedirectPath: jest.fn(),
                deleteRedirectPath: jest.fn(),
                getAccessToken: mockGetAccessToken,
                generateAuthUrl: jest.fn(),
                generateLogoutUrl: jest.fn(),
                generateTosUrl: mockGenerateTosUrl,
                getUserStateParameter: jest.fn(),
            };

            const settings = new SplunkAuthClientSettings(GRANT_TYPE_PKCE, CLIENT_ID, REDIRECT_URI);
            const authClient = new SplunkAuthClient(settings);

            // Act
            const result = await authClient.getAccessTokenContext().catch((e) => {
                done.fail(e);
            });

            // Assert
            expect(result).toBeUndefined();
            expect(mockStorageGet).toBeCalledTimes(1);
            expect(mockStorageClear).toBeCalledTimes(0);
            expect(mockGetAccessToken).toBeCalledTimes(1);
            expect(mockGenerateAuthUrl).toBeCalledTimes(0);
            expect(mockGenerateTosUrl).toBeCalledTimes(1);

            done();
        })
    });
});
