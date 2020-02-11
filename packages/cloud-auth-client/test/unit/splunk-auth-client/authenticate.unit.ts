import { AuthManager } from '../../../src/auth/auth-manager';
import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';
import { AccessToken } from '../../../src/model/access-token';
import { SplunkAuthClient } from '../../../src/splunk-auth-client';
import { GrantType, SplunkAuthClientSettings } from '../../../src/splunk-auth-client-settings';
import { mockWindowProperty } from '../fixture/test-setup';

const GRANT_TYPE = GrantType.IMPLICIT;
const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';
const URL_0 = new URL('https://newurl.com');

jest.useFakeTimers();

let mockStorageGet: jest.Mock;
let mockStorageSet: jest.Mock;
jest.mock('../../../src/token/token-manager', () => {
    return {
        TokenManager: jest.fn().mockImplementation(() => {
            return {
                get: mockStorageGet,
                set: mockStorageSet
            };
        }),
        TokenManagerSettings: jest.fn().mockImplementation()
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


describe('SplunkAuthClient', () => {
    let mockAuthManager: AuthManager;
    let mockGetAccessToken: jest.Mock;
    let mockGenerateAuthUrl: jest.Mock;

    function getAuthClient(): SplunkAuthClient {
        return new SplunkAuthClient(
            new SplunkAuthClientSettings(
                GRANT_TYPE,
                CLIENT_ID,
                REDIRECT_URI
            ));
    }

    beforeEach(() => {
        jest.spyOn(AuthManagerFactory, 'get').mockImplementation(() => {
            return mockAuthManager;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('authenticate', () => {
        const accessToken: AccessToken = {
            accessToken: 'abcd',
            expiresAt: Number.MAX_VALUE,
            expiresIn: 100,
            tokenType: 'token-type'
        };

        describe('with valid access token', () => {
            it('returns true', async () => {
                // Arrange
                mockStorageGet = jest.fn();
                mockStorageSet = jest.fn();
                mockGetAccessToken = jest.fn();
                mockGenerateAuthUrl = jest.fn();
                mockLoggerWarn = jest.fn();
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: mockGetAccessToken,
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn()
                };

                mockStorageGet = jest.fn((): AccessToken => {
                    return accessToken;
                });
                const authClient = getAuthClient();

                // Act
                const result = await authClient.authenticate();

                // Assert
                expect(result).toBeTruthy();
                expect(mockStorageGet).toBeCalledTimes(1);
            });
        });

        describe('with invalid access token', () => {
            mockWindowProperty('location', {
                href: ''
            });

            it('requests for a token and returns true', async () => {
                // Arrange
                mockGetAccessToken = jest.fn((): Promise<AccessToken> => {
                    return new Promise<AccessToken>((resolve) => resolve(accessToken));
                });
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: mockGetAccessToken,
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn()
                };

                mockStorageGet = jest.fn(() => {
                    return {};
                });
                const settings = new SplunkAuthClientSettings(
                    GRANT_TYPE,
                    CLIENT_ID,
                    REDIRECT_URI
                );
                settings.restorePathAfterLogin = false;
                const authClient = new SplunkAuthClient(settings);

                // Act
                const result = await authClient.authenticate();

                // Assert
                expect(result).toBeTruthy();
                expect(mockStorageGet).toBeCalledTimes(1);
                expect(mockGetAccessToken).toBeCalledTimes(1);
                expect(mockStorageSet).toBeCalledWith(accessToken);
                expect(mockStorageSet).toBeCalledTimes(1);
            });

            it('requests for an invalid token and returns false', async () => {
                // Arrange
                const invalidAccessToken: AccessToken = {
                    accessToken: '',
                    expiresAt: Number.MAX_VALUE,
                    expiresIn: 100,
                    tokenType: 'token-type'
                };
                mockGetAccessToken = jest.fn((): Promise<AccessToken> => {
                    return new Promise<AccessToken>((resolve) => resolve(invalidAccessToken));
                });
                mockGenerateAuthUrl = jest.fn(() => {
                    return URL_0;
                });
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: mockGetAccessToken,
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn()
                };

                mockStorageGet = jest.fn(() => {
                    return {};
                });
                const settings = new SplunkAuthClientSettings(
                    GRANT_TYPE,
                    CLIENT_ID,
                    REDIRECT_URI
                );
                settings.restorePathAfterLogin = false;
                const authClient = new SplunkAuthClient(settings);

                // Act
                const result = await authClient.authenticate();

                // Assert
                expect(result).toBeFalsy();
                expect(mockStorageGet).toBeCalledTimes(1);
                expect(mockGetAccessToken).toBeCalledTimes(1);
                expect(mockGenerateAuthUrl).toBeCalledWith(new Map());
                expect(mockGenerateAuthUrl).toBeCalledTimes(1);
            });

            it('throws error when requesting a token and autoRedirectToLogin is false', async (done) => {
                // Arrange
                const invalidAccessToken: AccessToken = {
                    accessToken: '',
                    expiresAt: Number.MAX_VALUE,
                    expiresIn: 100,
                    tokenType: 'token-type'
                };
                mockGetAccessToken = jest.fn((): Promise<AccessToken> => {
                    return new Promise<AccessToken>((resolve) => resolve(invalidAccessToken));
                });
                mockGenerateAuthUrl = jest.fn(() => {
                    return URL_0;
                });
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: mockGetAccessToken,
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn()
                };

                mockStorageGet = jest.fn(() => {
                    return {};
                });
                const settings = new SplunkAuthClientSettings(
                    GRANT_TYPE,
                    CLIENT_ID,
                    REDIRECT_URI
                );
                settings.restorePathAfterLogin = false;
                settings.autoRedirectToLogin = false;
                const authClient = new SplunkAuthClient(settings);

                // Act/Assert
                await authClient.authenticate()
                    .then(() => {
                        done.fail();
                    })
                    .catch((e) => {
                        expect(e).toEqual(new SplunkAuthClientError('Token not found.', 'token_not_found'));
                        expect(mockStorageGet).toBeCalledTimes(1);
                        expect(mockGetAccessToken).toBeCalledTimes(1);
                        expect(mockGenerateAuthUrl).toBeCalledTimes(0);
                        done();
                    });
            });
        });
    });
});
