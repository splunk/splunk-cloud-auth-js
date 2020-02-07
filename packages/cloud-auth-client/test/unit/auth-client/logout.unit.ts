import { AuthClient } from '../../../src/auth-client';
import { AuthClientSettings } from '../../../src/auth-client-settings';
import { mockWindowProperty } from '../fixture/test-setup';

const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';

jest.useFakeTimers();

let mockStorageGet: jest.Mock;
let mockStorageSet: jest.Mock;
let mockStorageClear: jest.Mock;
jest.mock('../../../src/token-manager', () => {
    return {
        TokenManager: jest.fn().mockImplementation(() => {
            return {
                get: mockStorageGet,
                set: mockStorageSet,
                clear: mockStorageClear
            };
        }),
        TokenManagerSettings: jest.fn().mockImplementation()
    };
});

let mockGenerateLogoutUrl: jest.Mock;
jest.mock('../../../src/oauth-param-manager', () => {
    return {
        OAuthParamManager: jest.fn().mockImplementation(() => {
            return {
                generateLogoutUrl: mockGenerateLogoutUrl
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
        mockStorageClear = jest.fn();
        mockGenerateLogoutUrl = jest.fn();
        mockLoggerWarn = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('logout', () => {
        describe('with redirectURI', () => {
            const hrefValue = 'https://href.com';
            const locationMock = {
                href: jest.fn()
            };
            mockWindowProperty('location', locationMock);

            it('with no url parameter sets location href', () => {
                // Arrange
                mockGenerateLogoutUrl = jest.fn(() => {
                    return {};
                })
                const authClient = getAuthClient();

                // Act
                authClient.logout();

                // Assert
                expect(mockStorageClear).toBeCalledTimes(1);
                expect(mockGenerateLogoutUrl).toBeCalledWith(REDIRECT_URI);
                expect(mockGenerateLogoutUrl).toBeCalledTimes(1);
            });

            it('with url parameter sets location href', () => {
                // Arrange
                mockGenerateLogoutUrl = jest.fn(() => {
                    return {};
                })
                const authClient = getAuthClient();

                // Act
                authClient.logout(hrefValue);

                // Assert
                expect(mockStorageClear).toBeCalledTimes(1);
                expect(mockGenerateLogoutUrl).toBeCalledWith(hrefValue);
                expect(mockGenerateLogoutUrl).toBeCalledTimes(1);
            });
        });

        describe('without redirect URI', () => {
            const hrefValue = 'https://href.com';
            const locationMock = {
                href: hrefValue
            };
            mockWindowProperty('location', locationMock);

            it('sets location href', () => {
                // Arrange
                mockGenerateLogoutUrl = jest.fn(() => {
                    return {};
                })
                const authSettings = new AuthClientSettings(CLIENT_ID, '');
                const authClient = new AuthClient(authSettings);

                // Act
                authClient.logout();

                // Assert
                expect(mockStorageClear).toBeCalledTimes(1);
                expect(mockGenerateLogoutUrl).toBeCalledWith(hrefValue);
                expect(mockGenerateLogoutUrl).toBeCalledTimes(1);
            });
        });
    });
});
