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

import { AuthProxy } from '@splunkdev/cloud-auth-common';
import { generateQueryParameters } from '@splunkdev/cloud-auth-common/src/util';

import { clearWindowLocationFragments, generateRandomString } from '../common/util';
import { SplunkAuthClientError } from "../error/splunk-auth-client-error";
import { SplunkOAuthError } from '../error/splunk-oauth-error';
import { AccessToken } from '../model/access-token';
import {
    REDIRECT_OAUTH_PARAMS_NAME,
    REDIRECT_PARAMS_STORAGE_NAME,
    REDIRECT_PATH_PARAMS_NAME,
} from '../splunk-auth-client-settings';
import { StorageManager } from '../storage/storage-manager';
import { validateHashParameters, validateOAuthParameters } from '../validator/implicit-param-validators';
import { AuthManager } from './auth-manager';

/**
 * ImplicitAuthManagerSettings.
 */
export class ImplicitAuthManagerSettings {
    /**
     * OAuthParamManagerSettings constructor.
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
 * ImplicitOAuthRedirectParams.
 */
export interface ImplicitOAuthRedirectParams {
    state: string;
    scope: string;
}

/**
 * ImplicitAuthManager.
 */
export class ImplicitAuthManager implements AuthManager {
    /**
     * ImplicitAuthManager constructor.
     * @param settings ImplicitAuthManagerSettings.
     */
    public constructor(settings: ImplicitAuthManagerSettings) {
        this._settings = settings;
        this._redirectParamsStorage = new StorageManager(this._settings.redirectParamsStorageName);
    }

    private _redirectParamsStorage: StorageManager;

    private _settings: ImplicitAuthManagerSettings;

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
     * Gets an access token from the OAuth parameters in the provided URL or the window location
     * @param url Url.
     */
    public async getAccessToken(url?: string): Promise<AccessToken> {
        try {
            const hashParameters = this.getHashParameters(url);
            const storedOAuthParameters = this.getRedirectOAuthParameters();

            clearWindowLocationFragments();

            if (hashParameters.get('state') !== storedOAuthParameters.state) {
                throw new SplunkOAuthError('OAuth flow response state does not match request state');
            }

            try {
                this._redirectParamsStorage.delete(REDIRECT_OAUTH_PARAMS_NAME);
            } catch (e) {
                throw new SplunkAuthClientError(
                    `Failed to remove the ${REDIRECT_OAUTH_PARAMS_NAME} data. ${e.message}`);
            }

            const accessToken: AccessToken = {
                accessToken: String(hashParameters.get('access_token')),
                expiresAt: Number(hashParameters.get('expires_in')) + Math.floor(Date.now() / 1000),
                expiresIn: Number(hashParameters.get('expires_in')),
                tokenType: String(hashParameters.get('token_type')),
                scopes: storedOAuthParameters.scope.split(' ')
            };

            return Promise.resolve(accessToken);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Generates the Authorize URL.
     * @param additionalQueryParams Additional query parameters.
     */
    public generateAuthUrl(additionalQueryParams?: Map<string, string>): URL {
        const oauthQueryParams = new Map([
            ['client_id', this._settings.clientId],
            ['redirect_uri', this._settings.redirectUri || window.location.href],
            ['response_type', 'token id_token'],
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

        const redirectStorageParms: ImplicitOAuthRedirectParams = {
            state: String(oauthQueryParams.get('state')),
            scope: String(oauthQueryParams.get('scope')),
        };
        this._redirectParamsStorage.set(JSON.stringify(redirectStorageParms), REDIRECT_OAUTH_PARAMS_NAME);

        const url = new URL(AuthProxy.PATH_AUTHORIZATION, this._settings.authHost);
        const queryParameterString = generateQueryParameters(oauthQueryParams);

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
    private getHashParameters(url?: string): URLSearchParams {
        const hash = url ? url.toString().substring(url.indexOf('#')) : window.location.hash.toString();
        const hashParameters = new URLSearchParams(hash.substr(1));
        validateHashParameters(hashParameters);

        return hashParameters;
    }

    private getRedirectOAuthParameters(): ImplicitOAuthRedirectParams {
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
