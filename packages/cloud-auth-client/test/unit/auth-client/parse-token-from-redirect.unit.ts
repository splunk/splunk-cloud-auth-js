import { AuthClient } from '../../../src/auth-client';
import { AuthClientSettings } from '../../../src/auth-client-settings';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';
import { AccessToken } from '../../../src/token-manager';

const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';

jest.useFakeTimers();

jest.mock('../../../src/token-manager', () => {
    return {
        TokenManager: jest.fn().mockImplementation(() => {
            return {};
        }),
        TokenManagerSettings: jest.fn().mockImplementation()
    };
});

let mockGetAccessTokenFromUrl: jest.Mock;
let mockGetRedirectPath: jest.Mock;
let mockDeleteRedirectPath: jest.Mock;
jest.mock('../../../src/oauth-param-manager', () => {
    return {
        OAuthParamManager: jest.fn().mockImplementation(() => {
            return {
                getAccessTokenFromUrl: mockGetAccessTokenFromUrl,
                getRedirectPath: mockGetRedirectPath,
                deleteRedirectPath: mockDeleteRedirectPath,
            };
        }),
        OAuthParamManagerSettings: jest.fn().mockImplementation()
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

describe('AuthClient', () => {

    function getAuthClient(): AuthClient {
        return new AuthClient(
            new AuthClientSettings(
                CLIENT_ID,
                REDIRECT_URI
            ));
    }

    beforeEach(() => {
        mockGetAccessTokenFromUrl = jest.fn();
        mockGetRedirectPath = jest.fn();
        mockDeleteRedirectPath = jest.fn();
        mockLoggerWarn = jest.fn();
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
            mockGetAccessTokenFromUrl = jest.fn((): Promise<AccessToken> => {
                return new Promise<AccessToken>((resolve) => resolve(accessToken));
            });
            mockGetRedirectPath = jest.fn(() => path);

            const authClient = getAuthClient();

            // Act
            const result = await authClient.parseTokenFromRedirect();

            // Assert
            expect(result).toEqual(accessToken);
            expect(mockGetAccessTokenFromUrl).toBeCalledTimes(1);
            expect(mockGetRedirectPath).toBeCalledTimes(1);
            expect(mockDeleteRedirectPath).toBeCalledTimes(1);
            expect(mockLoggerWarn).toBeCalledTimes(0);
        });

        it('with restorePathAfterLogin set to false returns AccessToken', async () => {
            // Arrange
            mockGetAccessTokenFromUrl = jest.fn((): Promise<AccessToken> => {
                return new Promise<AccessToken>((resolve) => resolve(accessToken));
            });
            mockGetRedirectPath = jest.fn(() => path);

            const authSettings = new AuthClientSettings(CLIENT_ID, '/');
            authSettings.restorePathAfterLogin = false;
            const authClient = new AuthClient(authSettings);

            // Act
            const result = await authClient.parseTokenFromRedirect();

            // Assert
            expect(result).toEqual(accessToken);
            expect(mockGetAccessTokenFromUrl).toBeCalledTimes(1);
            expect(mockGetRedirectPath).toBeCalledTimes(0);
            expect(mockDeleteRedirectPath).toBeCalledTimes(0);
        });

        it('with restorePathAfterLogin set to true and failed deleteRedirectPath returns AccessToken', async () => {
            // Arrange
            mockGetAccessTokenFromUrl = jest.fn((): Promise<AccessToken> => {
                return new Promise<AccessToken>((resolve) => resolve(accessToken));
            });
            mockGetRedirectPath = jest.fn(() => path);
            mockDeleteRedirectPath = jest.fn(() => { throw new Error('error'); });

            const authClient = getAuthClient();

            // Act
            const result = await authClient.parseTokenFromRedirect();

            // Assert
            expect(result).toEqual(accessToken);
            expect(mockGetAccessTokenFromUrl).toBeCalledTimes(1);
            expect(mockGetRedirectPath).toBeCalledTimes(1);
            expect(mockDeleteRedirectPath).toBeCalledTimes(1);
            expect(mockLoggerWarn).toBeCalledTimes(1);
        });

        it('returns null', async () => {
            // Arrange
            mockGetAccessTokenFromUrl = jest.fn((): Promise<AccessToken> => {
                return new Promise<AccessToken>(
                    (_resolve, reject) => reject(new SplunkAuthClientError('Unable to parse a token from the url')));
            });

            const authClient = getAuthClient();

            // Act
            const result = await authClient.parseTokenFromRedirect();

            // Assert
            expect(result).toBeNull();
            expect(mockGetAccessTokenFromUrl).toBeCalledTimes(1);
            expect(mockGetRedirectPath).toBeCalledTimes(0);
            expect(mockDeleteRedirectPath).toBeCalledTimes(0);
            expect(mockLoggerWarn).toBeCalledTimes(0);
        });

        it('throws exception', async (done) => {
            // Arrange
            mockGetAccessTokenFromUrl = jest.fn((): Promise<AccessToken> => {
                return new Promise<AccessToken>(
                    (_resolve, reject) => reject(new SplunkAuthClientError('Some error')));
            });

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
