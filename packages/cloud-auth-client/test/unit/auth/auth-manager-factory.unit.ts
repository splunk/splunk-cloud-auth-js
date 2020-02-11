import { AuthManagerFactory } from "../../../src/auth/auth-manager-factory";
import { GrantType } from "../../../src/splunk-auth-client-settings";

const CLIENT_ID = 'abcde';
const AUTH_HOST = 'https://authhost.com';
const REDIRECT_URI = 'https://redirect.com';

const mockImplicitAuthManager = {};
jest.mock('../../../src/auth/implicit-auth-manager', () => {
    return {
        ImplicitAuthManager: jest.fn().mockImplementation(() => {
            return mockImplicitAuthManager;
        }),
        ImplicitAuthManagerSettings: jest.fn().mockImplementation(() => {
            return {};
        })
    };
});

describe('AuthManagerFactory', () => {
    describe('get', () => {
        it('returns ImplicitAuthManager', () => {
            // Arrange/Act
            const result = AuthManagerFactory.get(GrantType.IMPLICIT, AUTH_HOST, CLIENT_ID, REDIRECT_URI);

            // Assert
            expect(result).toEqual(mockImplicitAuthManager);
        });
    });
});
