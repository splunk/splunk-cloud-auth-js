import { AuthClient } from '../../../src/auth-client';
import { AuthClientSettings } from '../../../src/auth-client-settings';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';

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

    beforeEach(() => {
        mockLoggerWarn = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('with auto redirect login should initialize the client and trigger authentication', () => {
            // Arrange
            const settings = new AuthClientSettings(
                CLIENT_ID,
                REDIRECT_URI
            );

            // Act
            const authClient = new AuthClient(settings);

            // Assert
            expect(authClient).not.toBeNull();
            expect(setTimeout).toBeCalledTimes(1);
        });

        it('initializes the client without triggering authentication', () => {
            // Arrange
            const settings = new AuthClientSettings(
                CLIENT_ID,
                REDIRECT_URI
            );
            settings.autoRedirectToLogin = false;

            // Act
            const authClient = new AuthClient(settings);

            // Assert
            expect(authClient).not.toBeNull();
            expect(setTimeout).toBeCalledTimes(0);
        });

        it('throws SplunkAuthClientError when clientId is not specified', () => {
            // Arrange
            const settings = new AuthClientSettings(
                '',
                REDIRECT_URI
            );

            // Act/Assert
            expect(() => {
                // eslint-disable-next-line no-new
                new AuthClient(settings);

            }).toThrow(new SplunkAuthClientError('Missing required configuration option "clientId".'));
        });
    });
});
