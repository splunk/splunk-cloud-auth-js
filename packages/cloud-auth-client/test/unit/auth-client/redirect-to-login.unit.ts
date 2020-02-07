import { AuthClient } from '../../../src/auth-client';
import { AuthClientSettings } from '../../../src/auth-client-settings';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';
import { mockWindowProperty } from '../fixture/test-setup';

const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';
const URL_0 = new URL('https://newurl.com');

jest.useFakeTimers();

jest.mock('../../../src/token-manager', () => {
    return {
        TokenManager: jest.fn().mockImplementation(() => {
            return {};
        }),
        TokenManagerSettings: jest.fn().mockImplementation()
    };
});

let mockSetRedirectPath: jest.Mock;
let mockGenerateAuthUrl: jest.Mock;
jest.mock('../../../src/oauth-param-manager', () => {
    return {
        OAuthParamManager: jest.fn().mockImplementation(() => {
            return {
                setRedirectPath: mockSetRedirectPath,
                generateAuthUrl: mockGenerateAuthUrl
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
        mockSetRedirectPath = jest.fn();
        mockGenerateAuthUrl = jest.fn();
        mockLoggerWarn = jest.fn();
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
                })
                mockSetRedirectPath = jest.fn(() => {
                    throw new SplunkAuthClientError('error message');
                })

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
                })

                const authSettings = new AuthClientSettings(CLIENT_ID, '/');
                authSettings.restorePathAfterLogin = false;
                const authClient = new AuthClient(authSettings);

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
                })

                const authSettings = new AuthClientSettings(CLIENT_ID, '/');
                authSettings.restorePathAfterLogin = false;
                authSettings.queryParamsForLogin = {
                    'prop1': 'newvalue1'
                }
                const authClient = new AuthClient(authSettings);

                // Act
                authClient.redirectToLogin();

                // Assert
                expect(mockGenerateAuthUrl).toBeCalledWith(new Map([['prop1', 'newvalue1']]));
                expect(mockGenerateAuthUrl).toBeCalledTimes(1);
            });
        })
    });
});
