import { AuthManager } from '../../../src/auth/auth-manager';
import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { SplunkAuthClient } from '../../../src/splunk-auth-client';
import { GrantType, SplunkAuthClientSettings } from '../../../src/splunk-auth-client-settings';

const GRANT_TYPE = GrantType.PKCE;
const CLIENT_ID = '12345678';
const REDIRECT_URI = 'https://redirect.com';
const TEST_REGION = 'iad10';
const TEST_TENANT = 'testtenant';

jest.useFakeTimers();

describe.only('Get tenant and region info', () => {
    let mockAuthManager: AuthManager;
    let mockGetUserStateParameter: jest.Mock;

    function getAuthClient(tenant?: string, region?: string): SplunkAuthClient {
        return new SplunkAuthClient(
            new SplunkAuthClientSettings(GRANT_TYPE, CLIENT_ID, REDIRECT_URI),
            tenant,
            region
        );
    }

    beforeEach(() => {
        mockGetUserStateParameter = jest.fn();
        mockAuthManager = {
            getRedirectPath: jest.fn(),
            setRedirectPath: jest.fn(),
            deleteRedirectPath: jest.fn(),
            getAccessToken: jest.fn(),
            generateAuthUrl: jest.fn(),
            generateLogoutUrl: jest.fn(),
            getUserStateParameter: mockGetUserStateParameter,
        }
        jest.spyOn(AuthManagerFactory, 'get').mockImplementation(() => {
            return mockAuthManager;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getTenantInfo', () => {
        it('with tenant and region passed in auth client', () => {
            // Arrange
            const authClient = getAuthClient(TEST_TENANT, TEST_REGION);

            // Act
            const info = authClient.getTenantInfo();

            // Assert
            const expectedUserState = {'tenant': TEST_TENANT, 'region': TEST_REGION};
            expect(mockGetUserStateParameter).toBeCalledTimes(0);
            expect(info).toEqual(expectedUserState);
            expect(info.tenant).toEqual(TEST_TENANT);
            expect(info.region).toEqual(TEST_REGION);
        });

        it('with tenant passed in auth client and region from user state parameters storage', () => {
            // Arrange
            const expectedUserState = {'tenant': TEST_TENANT, 'region': TEST_REGION};
            
            mockGetUserStateParameter = jest.fn(() => {
                return expectedUserState;
            });

            mockAuthManager = {
                getRedirectPath: jest.fn(),
                setRedirectPath: jest.fn(),
                deleteRedirectPath: jest.fn(),
                getAccessToken: jest.fn(),
                generateAuthUrl: jest.fn(),
                generateLogoutUrl: jest.fn(),
                getUserStateParameter: mockGetUserStateParameter,
            }

            const authClient = getAuthClient(TEST_TENANT, '');

            // Act
            const info = authClient.getTenantInfo();

            // Assert
            expect(mockGetUserStateParameter).toBeCalledTimes(1);
            expect(info).toEqual(expectedUserState);
            expect(info.tenant).toEqual(TEST_TENANT);
            expect(info.region).toEqual(TEST_REGION);
        });

        it('with tenant and region from user state parameters storage', () => {
            // Arrange
            const expectedUserState = {'tenant': TEST_TENANT, 'region': TEST_REGION};
            
            mockGetUserStateParameter = jest.fn(() => {
                return expectedUserState;
            });

            mockAuthManager = {
                getRedirectPath: jest.fn(),
                setRedirectPath: jest.fn(),
                deleteRedirectPath: jest.fn(),
                getAccessToken: jest.fn(),
                generateAuthUrl: jest.fn(),
                generateLogoutUrl: jest.fn(),
                getUserStateParameter: mockGetUserStateParameter,
            }

            const authClient = getAuthClient();

            // Act
            const info = authClient.getTenantInfo();

            // Assert
            expect(mockGetUserStateParameter).toBeCalledTimes(2);
            expect(info).toEqual(expectedUserState);
            expect(info.tenant).toEqual(TEST_TENANT);
            expect(info.region).toEqual(TEST_REGION);
        });
    });
});
