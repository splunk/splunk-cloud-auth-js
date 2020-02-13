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
jest.mock('../../../src/token/token-manager', () => {
    return {
        TokenManager: jest.fn().mockImplementation(() => {
            return {
                get: mockStorageGet,
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
        mockStorageGet = jest.fn();
        mockLoggerWarn = jest.fn();
        jest.spyOn(AuthManagerFactory, 'get').mockImplementation(() => {
            return mockAuthManager;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAccessTokenContext', () => {
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

            const authClient = getAuthClient();

            // Act
            const result = await authClient.getAccessTokenContext();

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
            mockGetAccessToken = jest.fn(() => {
                return new Promise((_resolve, reject) => reject(new SplunkAuthClientError('error message')));
            });
            mockAuthManager = {
                getRedirectPath: jest.fn(),
                setRedirectPath: jest.fn(),
                deleteRedirectPath: jest.fn(),
                getAccessToken: mockGetAccessToken,
                generateAuthUrl: mockGenerateAuthUrl,
                generateLogoutUrl: jest.fn()
            };

            const settings = new SplunkAuthClientSettings(
                GRANT_TYPE,
                CLIENT_ID,
                REDIRECT_URI
            );
            settings.restorePathAfterLogin = false;
            const authClient = new SplunkAuthClient(settings);

            // Act
            const result = await authClient.getAccessTokenContext();

            // Assert
            expect(result).toEqual(invalidAccessToken);
            expect(mockStorageGet).toBeCalledTimes(2);
            expect(mockGetAccessToken).toBeCalledTimes(1);
            expect(mockGenerateAuthUrl).toBeCalledTimes(1);
        });
    });
});
