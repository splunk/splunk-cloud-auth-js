import { AuthManager } from '../../../src/auth/auth-manager';
import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';
import { SplunkAuthClient } from '../../../src/splunk-auth-client';
import { GrantType, SplunkAuthClientSettings } from '../../../src/splunk-auth-client-settings';
import { mockWindowProperty } from '../fixture/test-setup';

const GRANT_TYPE = GrantType.IMPLICIT;
const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';
const URL_0 = new URL('https://newurl.com');

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
    let mockAuthManager: AuthManager;
    let mockSetRedirectPath: jest.Mock;
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
        mockSetRedirectPath = jest.fn();
        mockGenerateAuthUrl = jest.fn();
        mockLoggerWarn = jest.fn();
        jest.spyOn(AuthManagerFactory, 'get').mockImplementation(() => {
            return mockAuthManager;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('redirectToLogin', () => {
        describe('with restorePathAfterLogin set to true', () => {
            const hashValue = '#hashvalue';
            const pathNameValue = '/path/name.html';
            const searchValue = '?prop0=value0&prop1=value1';
            mockWindowProperty('location', {
                hash: hashValue,
                pathname: pathNameValue,
                search: searchValue
            });

            it('sets location href', () => {
                // Arrange
                mockGenerateAuthUrl = jest.fn(() => {
                    return URL_0;
                })
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: mockSetRedirectPath,
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: jest.fn(),
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn()
                };

                const authClient = getAuthClient();

                // Act
                authClient.redirectToLogin();

                // Assert
                expect(mockSetRedirectPath).toBeCalledWith(`${pathNameValue}${searchValue}${hashValue}`);
                expect(mockSetRedirectPath).toBeCalledTimes(1);
                expect(mockGenerateAuthUrl).toBeCalledWith(new Map());
                expect(mockGenerateAuthUrl).toBeCalledTimes(1);
            });

            it('with setRedirectPath throwing error sets location href', () => {
                // Arrange
                mockGenerateAuthUrl = jest.fn(() => {
                    return URL_0;
                });
                mockSetRedirectPath = jest.fn(() => {
                    throw new SplunkAuthClientError('error message');
                });
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: mockSetRedirectPath,
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: jest.fn(),
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn()
                };

                const authClient = getAuthClient();

                // Act
                authClient.redirectToLogin();

                // Assert
                expect(mockSetRedirectPath).toBeCalledWith(`${pathNameValue}${searchValue}${hashValue}`);
                expect(mockSetRedirectPath).toBeCalledTimes(1);
                expect(mockGenerateAuthUrl).toBeCalledWith(new Map());
                expect(mockGenerateAuthUrl).toBeCalledTimes(1);
                expect(mockLoggerWarn).toBeCalledTimes(1);
            });
        });

        describe('with restorePathAfterLogin set to false', () => {
            mockWindowProperty('location', {
                href: jest.fn(),
                search: '?prop0=value0&prop1=value1'
            });

            it('without additional params sets location href', () => {
                // Arrange
                mockGenerateAuthUrl = jest.fn(() => {
                    return URL_0;
                });
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: jest.fn(),
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn()
                };

                const authSettings = new SplunkAuthClientSettings(GRANT_TYPE, CLIENT_ID, '/');
                authSettings.restorePathAfterLogin = false;
                const authClient = new SplunkAuthClient(authSettings);

                // Act
                authClient.redirectToLogin();

                // Assert
                expect(mockGenerateAuthUrl).toBeCalledWith(new Map());
                expect(mockGenerateAuthUrl).toBeCalledTimes(1);
            });

            it('with additional params sets location href', () => {
                // Arrange
                mockGenerateAuthUrl = jest.fn(() => {
                    return URL_0;
                });
                mockAuthManager = {
                    getRedirectPath: jest.fn(),
                    setRedirectPath: jest.fn(),
                    deleteRedirectPath: jest.fn(),
                    getAccessToken: jest.fn(),
                    generateAuthUrl: mockGenerateAuthUrl,
                    generateLogoutUrl: jest.fn()
                };

                const authSettings = new SplunkAuthClientSettings(GRANT_TYPE, CLIENT_ID, '/');
                authSettings.restorePathAfterLogin = false;
                authSettings.queryParamsForLogin = {
                    'prop1': 'newvalue1'
                }
                const authClient = new SplunkAuthClient(authSettings);

                // Act
                authClient.redirectToLogin();

                // Assert
                expect(mockGenerateAuthUrl).toBeCalledWith(new Map([['prop1', 'newvalue1']]));
                expect(mockGenerateAuthUrl).toBeCalledTimes(1);
            });
        })
    });
});
