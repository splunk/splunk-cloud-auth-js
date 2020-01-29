import { assert, expect } from 'chai';

import { StorageManager } from '../../src/storage/storage-manager';
import token from '../../src/token';
import { TestData } from './fixture/test-data';

const REDIRECT_OAUTH_PARAMS_NAME = 'redirect-oauth-params';
const REDIRECT_PARAMS_STORAGE_NAME = 'splunk-redirect-params-storage';
const DEFAULT_AUTHORIZE_URL = 'https://auth.scp.splunk.com/authorize';

describe('token', () => {
    let storage: StorageManager;

    beforeEach(() => {
        storage = new StorageManager(REDIRECT_PARAMS_STORAGE_NAME);
    });

    afterEach(() => {
        storage.delete();
    });

    describe('parseFromUrl', () => {
        it('parses the access_token', async () => {
            const state = TestData.REDIRECT_OAUTH_PARAMS.state;
            const testUrl = `https://localhost:9097/#access_token=${
                TestData.ACCESS_TOKEN
                }&state=${state}`;
            const redirectParams = {
                ...TestData.REDIRECT_OAUTH_PARAMS,
                responseType: 'token',
            };

            // insert the redirect oauth param into session storage
            storage.set(JSON.stringify(redirectParams), REDIRECT_OAUTH_PARAMS_NAME);

            return token
                .parseFromUrl(testUrl)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .then((t: any) => {
                    expect(t).to.not.equal(undefined);
                    expect(t.authorizeUrl).to.equal(TestData.AUTHORIZE_URL);
                })
                .catch(e => {
                    expect(e.message).to.equal('Unable to parse a token from the url');
                });
        });

        it('parses the error from authorization server', async () => {
            const testUrl =
                'https://localhost:9097/#error=500&error_description=server%20internal%20error';

            // insert the redirect oauth param into session storage
            storage.set(
                JSON.stringify(TestData.REDIRECT_OAUTH_PARAMS),
                REDIRECT_OAUTH_PARAMS_NAME
            );

            return token
                .parseFromUrl(testUrl)
                .then(() => {
                    assert.fail('error is expected');
                })
                .catch(e => {
                    expect(e.name).to.equal('OAuthError');
                    expect(e.message).to.equal('server internal error');
                    expect(e.code).to.equal('500');
                });
        });

        it('fails when redirectParams are missing', async () => {
            const state = TestData.REDIRECT_OAUTH_PARAMS.state;
            const testUrl = `https://localhost:9097/#access_token=${
                TestData.ACCESS_TOKEN
                }&state=${state}`;

            return token
                .parseFromUrl(testUrl)
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
            const responseTypes = ['token', 'id_token'];
            const scopes = ['openid', 'email', 'profile'];

            token.getWithRedirect(
                TestData.CLIENT_ID,
                '',
                DEFAULT_AUTHORIZE_URL,
                {}
            );

            const params = storage.get(REDIRECT_OAUTH_PARAMS_NAME);
            const oauthParams = JSON.parse(params);
            expect(oauthParams.urls.authorizeUrl).to.equal(TestData.AUTHORIZE_URL);
            expect(oauthParams.responseType).to.deep.equal(responseTypes);
            expect(oauthParams.scopes).to.deep.equal(scopes);
        });
    });
});
