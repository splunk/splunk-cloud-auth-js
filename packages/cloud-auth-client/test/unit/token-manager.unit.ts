import { assert, expect } from 'chai';

import { AccessToken, TokenManager, TokenManagerSettings } from '../../src/token-manager';

const TOKEN_STORAGE_NAME = 'splunk-token-storage';

describe('TokenManager', () => {
    const settings = new TokenManagerSettings('', '', '', 0);
    const manager = new TokenManager(settings);
    const accessToken: AccessToken = {
        accessToken: 'abc',
        scopes: ['openid'],
        expiresAt: 1552607417,
        expiresIn: 999999,
        tokenType: 'Bearer'
    };

    it('should return empty if token is not set', () => {
        manager.clear();
        const token = manager.get();
        assert.equal(token, undefined);
    });

    it('should set the token in the storage', () => {
        manager.set(accessToken);
        const tokens = JSON.parse(sessionStorage.getItem(TOKEN_STORAGE_NAME));
        expect(tokens.accessToken).to.deep.equal(
            accessToken,
            'compare with the content in the sessionStorage'
        );

        const token = manager.get();
        expect(token).to.deep.equal(accessToken, 'compare with the TokenManager.get');
    });

    it('should clear the token in the storage', () => {
        manager.clear();
        const token = manager.get();
        assert.equal(token, undefined);

        const content = sessionStorage.getItem(TOKEN_STORAGE_NAME);
        expect(content).to.equal('{}');
    });
});
