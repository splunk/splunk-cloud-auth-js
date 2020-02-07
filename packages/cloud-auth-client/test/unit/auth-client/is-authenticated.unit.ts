import { AuthClient } from '../../../src/auth-client';
import { AuthClientSettings } from '../../../src/auth-client-settings';

const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';

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

jest.mock('../../../src/oauth-param-manager', () => {
    return {
        OAuthParamManager: jest.fn().mockImplementation(() => {
            return {};
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
        mockLoggerWarn = jest.fn();
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
