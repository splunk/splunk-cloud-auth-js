import { AuthManager } from '../../../src/auth/auth-manager';
import { AuthManagerFactory } from '../../../src/auth/auth-manager-factory';
import { GrantType } from '../../../src/splunk-auth-client-settings';

const CLIENT_ID = 'abcde';
const AUTH_HOST = 'https://authhost.com';
const REDIRECT_URI = 'https://redirect.com';
const REDIRECT_PARAM_STORAGE_NAME = 'storage-name';
const TENANT = 'testtenant';
const DEFAULT_ENABLE_TENANT_SCOPED_TOKENS = true;
const DEFAULT_ENABLE_MULTI_REGION_SUPPORT = true;

const mockImplicitAuthManager: AuthManager = {
    deleteRedirectPath: jest.fn(),
    generateAuthUrl: jest.fn(),
    generateLogoutUrl: jest.fn(),
    getAccessToken: jest.fn(),
    getRedirectPath: jest.fn(),
    setRedirectPath: jest.fn(),
    getUserStateParameter: jest.fn(),
};
jest.mock('../../../src/auth/implicit-auth-manager', () => {
    return {
        ImplicitAuthManager: jest.fn().mockImplementation(() => {
            return mockImplicitAuthManager;
        }),
        ImplicitAuthManagerSettings: jest.fn().mockImplementation(() => {
            return {};
        }),
    };
});

const mockPKCEAuthManager: AuthManager = {
    deleteRedirectPath: jest.fn(),
    generateAuthUrl: jest.fn(),
    generateLogoutUrl: jest.fn(),
    generateTosUrl: jest.fn(),
    getAccessToken: jest.fn(),
    getRedirectPath: jest.fn(),
    setRedirectPath: jest.fn(),
    getUserStateParameter: jest.fn(),
};
jest.mock('../../../src/auth/pkce-auth-manager', () => {
    return {
        PKCEAuthManager: jest.fn().mockImplementation(() => {
            return mockPKCEAuthManager;
        }),
        PKCEAuthManagerSettings: jest.fn().mockImplementation(() => {
            return {};
        }),
    };
});

describe('AuthManagerFactory', () => {
    describe('get', () => {
        it('returns ImplicitAuthManager', () => {
            // Arrange/Act
            const result = AuthManagerFactory.get(
                GrantType.IMPLICIT,
                AUTH_HOST,
                CLIENT_ID,
                REDIRECT_URI,
                '',
                '',
                REDIRECT_PARAM_STORAGE_NAME,
                DEFAULT_ENABLE_TENANT_SCOPED_TOKENS,
                DEFAULT_ENABLE_MULTI_REGION_SUPPORT,
            );

            // Assert
            expect(result).toEqual(mockImplicitAuthManager);
        });

        it('returns PKCEAuthManager', () => {
            // Arrange/Act
            const result = AuthManagerFactory.get(
                GrantType.PKCE,
                AUTH_HOST,
                CLIENT_ID,
                REDIRECT_URI,
                TENANT,
                '',
                REDIRECT_PARAM_STORAGE_NAME,
                DEFAULT_ENABLE_TENANT_SCOPED_TOKENS,
                DEFAULT_ENABLE_MULTI_REGION_SUPPORT
            );

            // Assert
            expect(result).toEqual(mockPKCEAuthManager);
        });
    });
});
