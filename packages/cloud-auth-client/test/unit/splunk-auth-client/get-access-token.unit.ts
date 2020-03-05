import { AuthManager } from '../../../src/auth/auth-manager';
import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { AccessToken } from '../../../src/model/access-token';
import { SplunkAuthClient } from '../../../src/splunk-auth-client';
import { GrantType, SplunkAuthClientSettings } from '../../../src/splunk-auth-client-settings';
import { mockWindowProperty } from '../fixture/test-setup';

const GRANT_TYPE = GrantType.PKCE;
const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';

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

describe('SplunkAuthClient', () => {
    let mockAuthManager: AuthManager;
    let mockGetAccessToken: jest.Mock;
    let mockGenerateAuthUrl: jest.Mock;

    beforeEach(() => {
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
            const accessToken: AccessToken = {
                accessToken: 'abc',
                expiresAt: Number.MAX_VALUE,
                expiresIn: 10,
                tokenType: 'token-type',
            };
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
    });
});
