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

import { clearWindowLocationFragments, generateRandomString } from '../common/util';
import { SplunkAuthClientError } from "../error/splunk-auth-client-error";
import { SplunkOAuthError } from "../error/splunk-oauth-error";
import { AccessToken } from '../model/access-token';
import {
    REDIRECT_OAUTH_PARAMS_NAME,
    REDIRECT_PARAMS_STORAGE_NAME,
    REDIRECT_PATH_PARAMS_NAME,
} from '../splunk-auth-client-settings';
import { StorageManager } from '../storage/storage-manager';
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
    public getAccessToken(url?: string): Promise<AccessToken> {
        const hash = url ? url.toString().substring(url.indexOf('#')) : window.location.hash.toString();
        const hashParameters = new URLSearchParams(hash.substr(1));

        // validate hash parameters.
        if (!hashParameters.get('access_token')
            || !hashParameters.get('expires_in')
            || !hashParameters.get('token_type')) {
            return Promise.reject(new SplunkAuthClientError('Unable to parse a token from the url'));
        }

        if (hashParameters.get('error') ||
            hashParameters.get('error_description')) {
            return Promise.reject(
                new SplunkOAuthError(
                    String(hashParameters.get('error_description')),
                    String(hashParameters.get('error'))));
        }

        // validate hash state and stored param state.
        const data = this._redirectParamsStorage.get(REDIRECT_OAUTH_PARAMS_NAME);
        if (!data) {
            return Promise.reject(new SplunkAuthClientError('Unable to retrieve OAuth redirect params storage'));
        }

        const storedOAuthParameters = JSON.parse(data);
        if (!!storedOAuthParameters
            && !!storedOAuthParameters.state
            && hashParameters.get('state') !== storedOAuthParameters.state) {
            return Promise.reject(new SplunkAuthClientError('OAuth flow response state does not match request state'));
        }

        try {
            this._redirectParamsStorage.delete(REDIRECT_OAUTH_PARAMS_NAME);
        } catch (e) {
            return Promise.reject(new SplunkAuthClientError(
                `Failed to remove the ${REDIRECT_OAUTH_PARAMS_NAME} data. ${e.message}`
            ));
        }

        if (!url) {
            clearWindowLocationFragments();
        }

        const accessToken: AccessToken = {
            accessToken: String(hashParameters.get('access_token')),
            expiresAt: Number(hashParameters.get('expires_in')) + Math.floor(Date.now() / 1000),
            expiresIn: Number(hashParameters.get('expires_in')),
            tokenType: String(hashParameters.get('token_type')),
            scopes: storedOAuthParameters.scopes
        };

        return Promise.resolve(accessToken);
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

        const url = new URL(AuthProxy.PATH_AUTHORIZATION, this._settings.authHost);
        let queryParameterString = '?';
        oauthQueryParams.forEach((value, key) => {
            if (value !== undefined && value !== null) {
                queryParameterString += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
            }
        });

        this._redirectParamsStorage.set(JSON.stringify({
            responseType: oauthQueryParams.get('response_type'),
            state: oauthQueryParams.get('state'),
            nonce: oauthQueryParams.get('nonce'),
            scopes: oauthQueryParams.get('scope'),
            clientId: oauthQueryParams.get('client_id')
        }), REDIRECT_OAUTH_PARAMS_NAME);

        return new URL(queryParameterString, url.href);
    }

    /**
     * Generates the Logout URL.
     * @param redirectUrl Optional redirect URL.
     */
    public generateLogoutUrl(redirectUrl: string): URL {
        const url = new URL(AuthProxy.PATH_LOGOUT, this._settings.authHost);
        const queryParameterString = `?redirect_uri=${redirectUrl}`;
        return new URL(queryParameterString, url);
    }
}
