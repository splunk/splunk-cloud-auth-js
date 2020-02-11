import { AuthManager } from '../../../src/auth/auth-manager';
import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { SplunkAuthClient } from '../../../src/splunk-auth-client';
import { GrantType, SplunkAuthClientSettings } from '../../../src/splunk-auth-client-settings';

const GRANT_TYPE = GrantType.IMPLICIT;
const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';

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
        mockAuthManager = {
            getRedirectPath: jest.fn(),
            setRedirectPath: jest.fn(),
            deleteRedirectPath: jest.fn(),
            getAccessToken: jest.fn(),
            generateAuthUrl: jest.fn(),
            generateLogoutUrl: jest.fn()
        };
        jest.spyOn(AuthManagerFactory, 'get').mockImplementation(() => {
            return mockAuthManager;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('isAuthenticated', () => {
        it('returns false when access token is undefined', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return undefined;
            });

            const authClient = getAuthClient();

            // Act/Assert
            expect(authClient.isAuthenticated()).toBeFalsy();
        });

        it('returns false when access token expiresAt is undefined', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return {};
            });

            const authClient = getAuthClient();

            // Act/Assert
            expect(authClient.isAuthenticated()).toBeFalsy();
        });

        it('returns false when access token expiresAt is in the past', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return {
                    expiresAt: 10,
                };
            });

            const authClient = getAuthClient();

            // Act/Assert
            expect(authClient.isAuthenticated()).toBeFalsy();
        });

        it('returns true when access token expiresAt is in the future', () => {
            // Arrange
            mockStorageGet = jest.fn(() => {
                return {
                    expiresAt: Number.MAX_VALUE,
                };
            });

            const authClient = getAuthClient();

            // Act/Assert
            expect(authClient.isAuthenticated()).toBeTruthy();
        });
    });
});
