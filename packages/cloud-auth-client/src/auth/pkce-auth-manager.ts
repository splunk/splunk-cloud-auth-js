/**
 * Copyright 2020 Splunk, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"): you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

import { AccessTokenResponse, AuthProxy } from '@splunkdev/cloud-auth-common';

import {
    clearWindowLocationFragments,
    createCodeChallenge,
    encodeCodeVerifier,
    generateCodeVerifier,
    generateRandomString
} from '../common/util';
import { SplunkAuthClientError } from "../error/splunk-auth-client-error";
import { SplunkOAuthError } from '../error/splunk-oauth-error';
import { AccessToken } from '../model/access-token';
import {
    REDIRECT_OAUTH_PARAMS_NAME,
    REDIRECT_PARAMS_STORAGE_NAME,
    REDIRECT_PATH_PARAMS_NAME,
} from '../splunk-auth-client-settings';
import { StorageManager } from '../storage/storage-manager';
import { validateOAuthParameters, validateSearchParameters } from '../validator/pkce-param-validators';
import { AuthManager } from './auth-manager';

/**
 * PKCEAuthManagerSettings.
 */
export class PKCEAuthManagerSettings {
    /**
     * PKCEAuthManagerSettings constructor.
     * @param authHost Authorize Host.
     * @param clientId Client Id.
     * @param redirectUri Redirect URI.
     */
    public constructor(
        authHost: string,
        clientId: string,
        redirectUri: string,
        redirectParamsStorageName = REDIRECT_PARAMS_STORAGE_NAME
    ) {
        this.authHost = authHost;
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.redirectParamsStorageName = redirectParamsStorageName;
    }

    /**
     * Client Id.
     */
    public clientId: string;

    /**
     * Redirect URI.
     */
    public redirectUri: string;

    /**
     * Authorization Host.
     */
    public authHost: string;

    /**
     * Redirect params storage name.
     */
    public redirectParamsStorageName: string;
}

/**
 * PKCEOAuthRedirectParams.
 */
export interface PKCEOAuthRedirectParams {
    state: string;
    codeVerifier: string;
}

/**
 * PKCEAuthManager.
 */
export class PKCEAuthManager implements AuthManager {
    /**
     * PKCEAuthManager constructor.
     * @param settings PKCEAuthManagerSettings.
     */
    public constructor(settings: PKCEAuthManagerSettings) {
        this._settings = settings;
        this._redirectParamsStorage = new StorageManager(this._settings.redirectParamsStorageName);
        this._authProxy = new AuthProxy(this._settings.authHost);
    }

    private _settings: PKCEAuthManagerSettings;

    private _redirectParamsStorage: StorageManager;

    private _authProxy: AuthProxy;

    /**
     * Gets redirect path from storage.
     */
    public getRedirectPath(): string {
        return this._redirectParamsStorage.get(REDIRECT_PATH_PARAMS_NAME);
    }

    /**
     * Sets redirect path in storage.
     * @param redirectPath Redirect path.
     */
    public setRedirectPath(redirectPath: string) {
        this._redirectParamsStorage.set(redirectPath, REDIRECT_PATH_PARAMS_NAME);
    }

    /**
     * Deletes redirect path in storage.
     */
    public deleteRedirectPath() {
        this._redirectParamsStorage.delete(REDIRECT_PATH_PARAMS_NAME);
    }

    /**
     * Gets an access token using the search parameters from a provided URL or window location
     * and stored OAuth parameters.  An underlying token API call is made to retrieve a new token.
     * @param url Url.
     */
    public async getAccessToken(url?: string): Promise<AccessToken> {
        const searchParameters = this.getSearchParameters(url);
        const storedOAuthParameters = this.getRedirectOAuthParameters();

        if (searchParameters.get('state') !== storedOAuthParameters.state) {
            throw new SplunkOAuthError('OAuth flow response state does not match request state');
        }

        try {
            this._redirectParamsStorage.delete(REDIRECT_OAUTH_PARAMS_NAME);
        } catch (e) {
            throw new SplunkAuthClientError(`Failed to remove the ${REDIRECT_OAUTH_PARAMS_NAME} data. ${e.message}`);
        }

        if (!url) {
            clearWindowLocationFragments();
        }

        // call authproxy accessToken to get token
        let accessToken: AccessTokenResponse;
        try {
            accessToken = await this._authProxy.accessToken(
                this._settings.clientId,
                String(searchParameters.get('code')),
                storedOAuthParameters.codeVerifier,
                this._settings.redirectUri);
        } catch (e) {
            throw new SplunkOAuthError(`Failed to retrieve access token from token endpoint. ${e.message}`);
        }

        return {
            accessToken: accessToken.access_token,
            expiresAt: accessToken.expires_in + Math.floor(Date.now() / 1000),
            expiresIn: accessToken.expires_in,
            tokenType: accessToken.token_type,
            scopes: accessToken.scope.split(' ')
        };
    }

    /**
     * Generates the Authorize URL.
     * @param additionalQueryParams Additional query parameters.
     */
    public generateAuthUrl(additionalQueryParams?: Map<string, string>): URL {
        const cv = generateCodeVerifier(50);
        const pkceParamCodeVerifier = encodeCodeVerifier(cv);
        const pkceParamCodeChallenge = createCodeChallenge(pkceParamCodeVerifier);

        const oauthQueryParams = new Map([
            ['client_id', this._settings.clientId],
            ['code_challenge', pkceParamCodeChallenge],
            ['code_challenge_method', 'S256'],
            ['redirect_uri', this._settings.redirectUri || window.location.href],
            ['response_type', 'code'],
            ['state', generateRandomString(64)],
            ['nonce', generateRandomString(64)],
            ['max_age', undefined],
            ['scope', 'openid email profile']
        ]);

        if (additionalQueryParams) {
            additionalQueryParams.forEach((value, key) => {
                oauthQueryParams.set(key, value);
            });
        }

        const redirectStorageParams: PKCEOAuthRedirectParams = {
            state: String(oauthQueryParams.get('state')),
            codeVerifier: pkceParamCodeVerifier
        };
        this._redirectParamsStorage.set(JSON.stringify(redirectStorageParams), REDIRECT_OAUTH_PARAMS_NAME);

        const url = new URL(AuthProxy.PATH_AUTHORIZATION, this._settings.authHost);
        let queryParameterString = '?';
        oauthQueryParams.forEach((value, key) => {
            if (value !== undefined && value !== null) {
                queryParameterString += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
            }
        });

        return new URL(queryParameterString, url.href);
    }

    /**
     * Generates the Logout URL.
     * @param redirectUrl Optional redirect URL.
     */
    public generateLogoutUrl(redirectUrl: string): URL {
        const url = new URL(AuthProxy.PATH_LOGOUT, this._settings.authHost);
        const queryParameterString = `?redirect_uri=${encodeURIComponent(redirectUrl)}`;
        return new URL(queryParameterString, url);
    }

    // eslint-disable-next-line class-methods-use-this
    private getSearchParameters(url?: string): URLSearchParams {
        const hash = url ? url.toString().substring(url.indexOf('?')) : window.location.search.toString();
        const hashParameters = new URLSearchParams(hash.substr(1));
        validateSearchParameters(hashParameters);

        return hashParameters;
    }

    private getRedirectOAuthParameters(): PKCEOAuthRedirectParams {
        let storedOAuthParameters
        try {
            const data = this._redirectParamsStorage.get(REDIRECT_OAUTH_PARAMS_NAME);
            storedOAuthParameters = JSON.parse(data);
        } catch {
            throw new SplunkAuthClientError('Unable to retrieve and parse OAuth redirect params storage');
        }
        validateOAuthParameters(storedOAuthParameters);

        return storedOAuthParameters;
    }
}
