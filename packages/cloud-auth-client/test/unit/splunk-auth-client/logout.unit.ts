import { AuthManager } from '../../../src/auth/auth-manager';
import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { SplunkAuthClient } from '../../../src/splunk-auth-client';
import { GrantType, SplunkAuthClientSettings } from '../../../src/splunk-auth-client-settings';
import { mockWindowProperty } from '../fixture/test-setup';

const GRANT_TYPE = GrantType.IMPLICIT;
const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';

jest.useFakeTimers();

let mockStorageGet: jest.Mock;
let mockStorageSet: jest.Mock;
let mockStorageClear: jest.Mock;
jest.mock('../../../src/token/token-manager', () => {
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
    let mockGenerateLogoutUrl: jest.Mock;

    function getAuthClient(): SplunkAuthClient {
        return new SplunkAuthClient(
            new SplunkAuthClientSettings(
                GRANT_TYPE,
                CLIENT_ID,
                REDIRECT_URI
            ));
    }

    beforeEach(() => {
        mockStorageClear = jest.fn();
        mockGenerateLogoutUrl = jest.fn();
        mockLoggerWarn = jest.fn();
        jest.spyOn(AuthManagerFactory, 'get').mockImplementation(() => {
            return mockAuthManager;
        });
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
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: jest.fn(),
                    generateAuthUrl: jest.fn(),
                    generateLogoutUrl: mockGenerateLogoutUrl,
                    getUserStateParameter: jest.fn(),
                };
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
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: jest.fn(),
                    generateAuthUrl: jest.fn(),
                    generateLogoutUrl: mockGenerateLogoutUrl,
                    getUserStateParameter: jest.fn(),
                };

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
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: jest.fn(),
                    generateAuthUrl: jest.fn(),
                    generateLogoutUrl: mockGenerateLogoutUrl,
                    getUserStateParameter: jest.fn(),
                };

                const authSettings = new SplunkAuthClientSettings(GRANT_TYPE, CLIENT_ID, '');
                const authClient = new SplunkAuthClient(authSettings);

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
