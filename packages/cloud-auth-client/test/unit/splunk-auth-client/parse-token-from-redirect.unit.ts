import { AuthManager } from '../../../src/auth/auth-manager';
import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';
import { AccessToken } from '../../../src/model/access-token';
import { SplunkAuthClient } from '../../../src/splunk-auth-client';
import { GrantType, SplunkAuthClientSettings } from '../../../src/splunk-auth-client-settings';

const GRANT_TYPE = GrantType.IMPLICIT;
const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';

jest.useFakeTimers();

jest.mock('../../../src/token/token-manager', () => {
    return {
        TokenManager: jest.fn().mockImplementation(() => {
            return {};
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
    let mockGetRedirectPath: jest.Mock;
    let mockDeleteRedirectPath: jest.Mock;

    function getAuthClient(): SplunkAuthClient {
        return new SplunkAuthClient(
            new SplunkAuthClientSettings(
                GRANT_TYPE,
                CLIENT_ID,
                REDIRECT_URI
            ));
    }

    beforeEach(() => {
        mockGetAccessToken = jest.fn();
        mockGetRedirectPath = jest.fn();
        mockDeleteRedirectPath = jest.fn();
        mockLoggerWarn = jest.fn();
        jest.spyOn(AuthManagerFactory, 'get').mockImplementation(() => {
            return mockAuthManager;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('parseTokenFromRedirect', () => {
        const accessToken: AccessToken = {
            accessToken: 'abc',
            expiresAt: 10,
            expiresIn: 10,
            tokenType: 'token-type'
        }
        const path = "/";

        it('with restorePathAfterLogin set to true returns AccessToken', async () => {
            // Arrange
            mockGetAccessToken = jest.fn((): Promise<AccessToken> => {
                return new Promise<AccessToken>((resolve) => resolve(accessToken));
            });
            mockGetRedirectPath = jest.fn(() => path);
            mockAuthManager = {
                getRedirectPath: mockGetRedirectPath,
                setRedirectPath: jest.fn(),
                deleteRedirectPath: mockDeleteRedirectPath,
                getAccessToken: mockGetAccessToken,
                generateAuthUrl: jest.fn(),
                generateLogoutUrl: jest.fn()
            };

            const authClient = getAuthClient();

            // Act
            const result = await authClient.parseTokenFromRedirect();

            // Assert
            expect(result).toEqual(accessToken);
            expect(mockGetAccessToken).toBeCalledTimes(1);
            expect(mockGetRedirectPath).toBeCalledTimes(1);
            expect(mockDeleteRedirectPath).toBeCalledTimes(1);
            expect(mockLoggerWarn).toBeCalledTimes(0);
        });

        it('with restorePathAfterLogin set to false returns AccessToken', async () => {
            // Arrange
            mockGetAccessToken = jest.fn((): Promise<AccessToken> => {
                return new Promise<AccessToken>((resolve) => resolve(accessToken));
            });
            mockGetRedirectPath = jest.fn(() => path);
            mockAuthManager = {
                getRedirectPath: mockGetRedirectPath,
                setRedirectPath: jest.fn(),
                deleteRedirectPath: jest.fn(),
                getAccessToken: mockGetAccessToken,
                generateAuthUrl: jest.fn(),
                generateLogoutUrl: jest.fn()
            };

            const authSettings = new SplunkAuthClientSettings(GRANT_TYPE, CLIENT_ID, '/');
            authSettings.restorePathAfterLogin = false;
            const authClient = new SplunkAuthClient(authSettings);

            // Act
            const result = await authClient.parseTokenFromRedirect();

            // Assert
            expect(result).toEqual(accessToken);
            expect(mockGetAccessToken).toBeCalledTimes(1);
            expect(mockGetRedirectPath).toBeCalledTimes(0);
            expect(mockDeleteRedirectPath).toBeCalledTimes(0);
        });

        it('with restorePathAfterLogin set to true and failed deleteRedirectPath returns AccessToken', async () => {
            // Arrange
            mockGetAccessToken = jest.fn((): Promise<AccessToken> => {
                return new Promise<AccessToken>((resolve) => resolve(accessToken));
            });
            mockGetRedirectPath = jest.fn(() => path);
            mockDeleteRedirectPath = jest.fn(() => { throw new Error('error'); });
            mockAuthManager = {
                getRedirectPath: mockGetRedirectPath,
                setRedirectPath: jest.fn(),
                deleteRedirectPath: mockDeleteRedirectPath,
                getAccessToken: mockGetAccessToken,
                generateAuthUrl: jest.fn(),
                generateLogoutUrl: jest.fn()
            };

            const authClient = getAuthClient();

            // Act
            const result = await authClient.parseTokenFromRedirect();

            // Assert
            expect(result).toEqual(accessToken);
            expect(mockGetAccessToken).toBeCalledTimes(1);
            expect(mockGetRedirectPath).toBeCalledTimes(1);
            expect(mockDeleteRedirectPath).toBeCalledTimes(1);
            expect(mockLoggerWarn).toBeCalledTimes(1);
        });

        it('returns null', async () => {
            // Arrange
            mockGetAccessToken = jest.fn((): Promise<AccessToken> => {
                return new Promise<AccessToken>(
                    (_resolve, reject) => reject(new SplunkAuthClientError('Unable to parse a token from the url')));
            });
            mockAuthManager = {
                getRedirectPath: jest.fn(),
                setRedirectPath: jest.fn(),
                deleteRedirectPath: jest.fn(),
                getAccessToken: mockGetAccessToken,
                generateAuthUrl: jest.fn(),
                generateLogoutUrl: jest.fn()
            };

            const authClient = getAuthClient();

            // Act
            const result = await authClient.parseTokenFromRedirect();

            // Assert
            expect(result).toBeNull();
            expect(mockGetAccessToken).toBeCalledTimes(1);
            expect(mockGetRedirectPath).toBeCalledTimes(0);
            expect(mockDeleteRedirectPath).toBeCalledTimes(0);
            expect(mockLoggerWarn).toBeCalledTimes(0);
        });

        it('throws exception', async (done) => {
            // Arrange
            mockGetAccessToken = jest.fn((): Promise<AccessToken> => {
                return new Promise<AccessToken>(
                    (_resolve, reject) => reject(new SplunkAuthClientError('Some error')));
            });
            mockAuthManager = {
                getRedirectPath: jest.fn(),
                setRedirectPath: jest.fn(),
                deleteRedirectPath: jest.fn(),
                getAccessToken: mockGetAccessToken,
                generateAuthUrl: jest.fn(),
                generateLogoutUrl: jest.fn()
            };

            const authClient = getAuthClient();

            // Act
            await authClient.parseTokenFromRedirect()
                .then(() => {
                    done.fail();
                })
                .catch((e) => {
                    expect(e).toEqual(new SplunkAuthClientError('Some error'));
                    done();
                })
        });
    });
});
