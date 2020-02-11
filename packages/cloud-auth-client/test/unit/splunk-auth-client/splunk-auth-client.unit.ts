import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';
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

    beforeEach(() => {
        mockLoggerWarn = jest.fn();
        jest.spyOn(AuthManagerFactory, 'get').mockImplementation(() => {
            return {
                getRedirectPath: jest.fn(),
                setRedirectPath: jest.fn(),
                deleteRedirectPath: jest.fn(),
                getAccessToken: jest.fn(),
                generateAuthUrl: jest.fn(),
                generateLogoutUrl: jest.fn()
            };
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('with auto redirect login should initialize the client and trigger authentication', () => {
            // Arrange
            const settings = new SplunkAuthClientSettings(
                GRANT_TYPE,
                CLIENT_ID,
                REDIRECT_URI
            );

            // Act
            const authClient = new SplunkAuthClient(settings);

            // Assert
            expect(authClient).not.toBeNull();
            expect(setTimeout).toBeCalledTimes(1);
        });

        it('initializes the client without triggering authentication', () => {
            // Arrange
            const settings = new SplunkAuthClientSettings(
                GRANT_TYPE,
                CLIENT_ID,
                REDIRECT_URI
            );
            settings.autoRedirectToLogin = false;

            // Act
            const authClient = new SplunkAuthClient(settings);

            // Assert
            expect(authClient).not.toBeNull();
            expect(setTimeout).toBeCalledTimes(0);
        });

        it('throws SplunkAuthClientError when clientId is not specified', () => {
            // Arrange
            const settings = new SplunkAuthClientSettings(
                GRANT_TYPE,
                '',
                REDIRECT_URI
            );

            // Act/Assert
            expect(() => {
                // eslint-disable-next-line no-new
                new SplunkAuthClient(settings);

            }).toThrow(new SplunkAuthClientError('Missing required configuration option "clientId".'));
        });
    });
});
