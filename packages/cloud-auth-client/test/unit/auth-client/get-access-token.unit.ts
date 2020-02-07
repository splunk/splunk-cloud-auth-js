import { AuthClient } from '../../../src/auth-client';
import { AuthClientSettings } from '../../../src/auth-client-settings';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';
import { AccessToken } from '../../../src/token-manager';
import { mockWindowProperty } from '../fixture/test-setup';

const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';
const URL_0 = new URL('https://newurl.com');

jest.useFakeTimers();

let mockStorageGet: jest.Mock;
jest.mock('../../../src/token-manager', () => {
    return {
        TokenManager: jest.fn().mockImplementation(() => {
            return {
                get: mockStorageGet,
            };
        }),
        TokenManagerSettings: jest.fn().mockImplementation()
    };
});

let mockGetAccessTokenFromUrl: jest.Mock;
let mockGenerateAuthUrl: jest.Mock;
jest.mock('../../../src/oauth-param-manager', () => {
    return {
        OAuthParamManager: jest.fn().mockImplementation(() => {
            return {
                getAccessTokenFromUrl: mockGetAccessTokenFromUrl,
                generateAuthUrl: mockGenerateAuthUrl
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
        mockStorageGet = jest.fn();
        mockGetAccessTokenFromUrl = jest.fn();
        mockGenerateAuthUrl = jest.fn();
        mockLoggerWarn = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAccessToken', () => {
        mockWindowProperty('location', {
            href: ''
        });

        it('returns AccessToken after authenticating', async () => {
            // Arrange
            const accessToken: AccessToken = {
                accessToken: 'abc',
                expiresAt: Number.MAX_VALUE,
                expiresIn: 10,
                tokenType: 'token-type'
            }
            mockStorageGet = jest.fn((): AccessToken => {
                return accessToken;
            });
            const authClient = getAuthClient();

            // Act
            const result = await authClient.getAccessToken();

            // Assert
            expect(result).toEqual(accessToken);
            expect(mockStorageGet).toBeCalledTimes(2);
            expect(mockGenerateAuthUrl).toBeCalledTimes(0);
        });

        it('returns AccessToken after failing to authenticate and redirecting to login', async () => {
            // Arrange
            const invalidAccessToken: AccessToken = {
                accessToken: 'abc',
                expiresAt: 1,
                expiresIn: 10,
                tokenType: 'token-type'
            }
            mockStorageGet = jest.fn((): AccessToken => {
                return invalidAccessToken;
            });
            mockGenerateAuthUrl = jest.fn(() => {
                return URL_0;
            });
            mockGetAccessTokenFromUrl = jest.fn(() => {
                return new Promise((_resolve, reject) => reject(new SplunkAuthClientError('error message')));
            });
            const settings = new AuthClientSettings(
                CLIENT_ID,
                REDIRECT_URI
            );
            settings.restorePathAfterLogin = false;
            const authClient = new AuthClient(settings);

            // Act
            const result = await authClient.getAccessToken();

            // Assert
            expect(result).toEqual(invalidAccessToken);
            expect(mockStorageGet).toBeCalledTimes(2);
            expect(mockGenerateAuthUrl).toBeCalledTimes(1);
        });
    });
});
