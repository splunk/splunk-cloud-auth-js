import { AuthManager } from '../../../src/auth/auth-manager';
import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { SplunkAuthClient } from '../../../src/splunk-auth-client';
import { GrantType, SplunkAuthClientSettings } from '../../../src/splunk-auth-client-settings';
import { mockWindowProperty } from '../fixture/test-setup';

const GRANT_TYPE = GrantType.PKCE;
const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';

jest.useFakeTimers();

let mockStorageClear: jest.Mock;
jest.mock('../../../src/token/token-manager', () => {
    return {
        TokenManager: jest.fn().mockImplementation(() => {
            return {
                clear: mockStorageClear,
            };
        }),
        TokenManagerSettings: jest.fn().mockImplementation(),
    };
});

describe('SplunkAuthClient', () => {
    let mockAuthManager: AuthManager;

    function getAuthClient(): SplunkAuthClient {
        return new SplunkAuthClient(
            new SplunkAuthClientSettings(GRANT_TYPE, CLIENT_ID, REDIRECT_URI)
        );
    }

    beforeEach(() => {
        mockStorageClear = jest.fn();
        mockAuthManager = {
            getRedirectPath: jest.fn(),
            setRedirectPath: jest.fn(),
            deleteRedirectPath: jest.fn(),
            getAccessToken: jest.fn(),
            generateAuthUrl: jest.fn(),
            generateLogoutUrl: jest.fn(),
        };

        jest.spyOn(AuthManagerFactory, 'get').mockImplementation(() => {
            return mockAuthManager;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('clearAccessToken', () => {
        mockWindowProperty('location', {
            href: '',
        });

        it('calls TokenManager clear', () => {
            // Arrange
            const authClient = getAuthClient();

            // Act
            authClient.clearAccessToken();

            // Assert
            expect(mockStorageClear).toBeCalledTimes(1);
        });
    });
});
