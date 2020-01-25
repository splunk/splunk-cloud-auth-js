import { assert, expect } from 'chai';

import { TokenManager, TokenManagerSettings } from '../../../src/lib/TokenManager';

const TOKEN_STORAGE_NAME = 'splunk-token-storage';

describe('TokenManager', () => {
    const settings = new TokenManagerSettings('', '', '', 0);
    const manager = new TokenManager(settings);
    const accessToken = {
        accessToken: 'abc',
        scopes: ['openid'],
        expiresAt: 1552607417,
    };

    it('should return empty if token is not set', () => {
        manager.clear();
        const token = manager.get('accessToken');
        assert.equal(token, undefined);
    });

    it('should set the token in the storage', () => {
        manager.add('accessToken', accessToken);
        const tokens = JSON.parse(sessionStorage.getItem(TOKEN_STORAGE_NAME));
        expect(tokens.accessToken).to.deep.equal(
            accessToken,
            'compare with the content in the sessionStorage'
        );

        const token = manager.get('accessToken');
        expect(token).to.deep.equal(accessToken, 'compare with the TokenManager.get');
    });

    it('should throw error if the token has missing fields', () => {
        const token = {
            ...accessToken,
        };
        delete token.expiresAt;
        try {
            manager.add('accessToken', token);
            assert.fail('invalid token object should not be added');
        } catch (e) {
            expect(e.name).to.equal('AuthClientError');
            expect(e.message).to.equal(
                'Token must be an Object with scopes, expiresAt, and an idToken or accessToken properties'
            );
        }
    });

    it('should delete the token in the storage', () => {
        manager.remove('accessToken');
        const token = manager.get('accessToken');
        assert.equal(token, undefined);

        const content = sessionStorage.getItem(TOKEN_STORAGE_NAME);
        expect(content).to.equal('{}');
    });
});
