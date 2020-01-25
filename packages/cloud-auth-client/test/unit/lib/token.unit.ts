import { assert, expect } from 'chai';

import { AuthClientSettings } from '../../../src/auth-client-settings';
import AuthClient from '../../../src/AuthClient';
import StorageManager from '../../../src/lib/storage';
import token from '../../../src/lib/token';
import { TestData } from '../fixture/test-data';

const REDIRECT_OAUTH_PARAMS_NAME = 'redirect-oauth-params';
const REDIRECT_PARAMS_STORAGE_NAME = 'splunk-redirect-params-storage';

describe('token', () => {
    describe('parseFromUrl', () => {
        const settings = new AuthClientSettings(
            TestData.CLIENT_ID,
            ''
        );
        const authClient = new AuthClient(settings);
        const storage = new StorageManager(REDIRECT_PARAMS_STORAGE_NAME);

        it('parses the access_token', () => {
            const state = TestData.REDIRECT_OAUTH_PARAMS.state;
            const testUrl = `https://localhost:9097/#access_token=${
                TestData.ACCESS_TOKEN
                }&state=${state}`;
            const redirectParams = {
                ...TestData.REDIRECT_OAUTH_PARAMS,
                responseType: 'token',
            };

            // insert the redirect oauth param into session storage
            storage.add(REDIRECT_OAUTH_PARAMS_NAME, JSON.stringify(redirectParams));

            return token
                .parseFromUrl(authClient, testUrl)
                .then(t => {
                    expect(t).to.not.equal(undefined);
                    expect(t.authorizeUrl).to.equal(TestData.AUTHORIZE_URL);
                })
                .catch(e => {
                    expect(e.message).to.equal('Unable to parse a token from the url');
                });
        });

        it('parses the error from authorization server', () => {
            const testUrl =
                'https://localhost:9097/#error=500&error_description=server%20internal%20error';

            // insert the redirect oauth param into session storage
            storage.add(
                REDIRECT_OAUTH_PARAMS_NAME,
                JSON.stringify(TestData.REDIRECT_OAUTH_PARAMS)
            );

            return token
                .parseFromUrl(authClient, testUrl)
                .then(() => {
                    assert.fail('error is expected');
                })
                .catch(e => {
                    expect(e.name).to.equal('OAuthError');
                    expect(e.message).to.equal('server internal error');
                    expect(e.errorCode).to.equal('500');
                });
        });

        it('fails when redirectParams are missing', () => {
            const state = TestData.REDIRECT_OAUTH_PARAMS.state;
            const testUrl = `https://localhost:9097/#access_token=${
                TestData.ACCESS_TOKEN
                }&state=${state}`;

            return token
                .parseFromUrl(authClient, testUrl)
                .then(() => {
                    assert.fail('error is expected');
                })
                .catch(e => {
                    expect(e.message).to.equal('Unable to retrieve OAuth redirect params storage');
                });
        });
    });

    describe('getWithRedirect', () => {
        it('sets the redirect params', () => {
            const settings = new AuthClientSettings(
                TestData.CLIENT_ID,
                ''
            );
            const authClient = new AuthClient(settings);
            const request = {
                responseType: ['token', 'id_token'],
                scopes: ['openid', 'email', 'profile'],
            };
            token.getWithRedirect(
                authClient.options.clientId,
                authClient.options.redirectUri,
                authClient.options.authorizeUrl,
                {}
            );
            const storage = new StorageManager(REDIRECT_PARAMS_STORAGE_NAME);
            const params = storage.get(REDIRECT_OAUTH_PARAMS_NAME);
            const oauthParams = JSON.parse(params);
            expect(oauthParams.urls.authorizeUrl).to.equal(TestData.AUTHORIZE_URL);
            expect(oauthParams.responseType).to.deep.equal(request.responseType);
            expect(oauthParams.scopes).to.deep.equal(request.scopes);
        });
    });
});
