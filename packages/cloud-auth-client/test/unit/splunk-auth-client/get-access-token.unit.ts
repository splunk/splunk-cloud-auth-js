import { AuthManager } from '../../../src/auth/auth-manager';
import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { SplunkOAuthError } from '../../../src/error/splunk-oauth-error';
import { AccessToken } from '../../../src/model/access-token';
import { SplunkAuthClient } from '../../../src/splunk-auth-client';
import { GrantType, SplunkAuthClientSettings } from '../../../src/splunk-auth-client-settings';
import { mockWindowProperty } from '../fixture/test-setup';

const GRANT_TYPE = GrantType.PKCE;
const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';
const URL_0 = new URL('https://newurl.com');

jest.useFakeTimers();

let mockStorageClear: jest.Mock;
let mockStorageGet: jest.Mock;
jest.mock('../../../src/token/token-manager', () => {
    return {
        TokenManager: jest.fn().mockImplementation(() => {
            return {
                clear: mockStorageClear,
                get: mockStorageGet,
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

    beforeEach(() => {
        mockLoggerWarn = jest.fn();
        mockStorageClear = jest.fn();
        mockStorageGet = jest.fn();
        jest.spyOn(AuthManagerFactory, 'get').mockImplementation(() => {
            return mockAuthManager;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAccessToken', () => {
        mockWindowProperty('location', {
            href: '',
        });

        it('returns AccessToken after authenticating', async () => {
            // Arrange
            mockStorageGet = jest.fn(
                (): AccessToken => {
                    return accessToken;
                }
            );
            mockGetAccessToken = jest.fn();
            mockGenerateAuthUrl = jest.fn();
            mockAuthManager = {
                getRedirectPath: jest.fn(),
                setRedirectPath: jest.fn(),
                deleteRedirectPath: jest.fn(),
                getAccessToken: mockGetAccessToken,
                generateAuthUrl: mockGenerateAuthUrl,
                generateLogoutUrl: jest.fn(),
            };

            const authClient = new SplunkAuthClient(
                new SplunkAuthClientSettings(GRANT_TYPE, CLIENT_ID, REDIRECT_URI)
            );

            // Act
            const result = await authClient.getAccessToken();

            // Assert
            expect(result).toEqual(accessToken.accessToken);
            expect(mockStorageGet).toBeCalledTimes(2);
            expect(mockGenerateAuthUrl).toBeCalledTimes(0);
        });

        it('returns empty string when redirecting to login page', async (done) => {
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
            };

            const settings = new SplunkAuthClientSettings(GRANT_TYPE, CLIENT_ID, REDIRECT_URI);
            settings.restorePathAfterLogin = true;
            const authClient = new SplunkAuthClient(settings);

            // Act
            const result = await authClient.getAccessToken().catch((e) => {
                done.fail(e);
            });

            // Assert
            expect(result).toEqual('');
            expect(mockStorageGet).toBeCalledTimes(1);
            expect(mockStorageClear).toBeCalledTimes(0);
            expect(mockGetAccessToken).toBeCalledTimes(1);
            expect(mockGenerateAuthUrl).toBeCalledTimes(1);

            done();
        });
    });
});
