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
import { generateQueryParameters } from '@splunkdev/cloud-auth-common/src/util';

import {
    clearWindowLocationFragments,
    createCodeChallenge,
    encodeCodeVerifier,
    generateCodeVerifier,
    generateRandomString,
    generateRegionBasedAuthHost,
    generateTenantBasedAuthHost
} from '../common/util';
import { SplunkAuthClientError } from "../error/splunk-auth-client-error";
import {
    ERROR_CODE_UNSIGNED_TOS,
    SplunkOAuthError
} from '../error/splunk-oauth-error';
import { AccessToken } from '../model/access-token';
import { UserState } from '../model/user-state';
import {
    DEFAULT_ENABLE_MULTI_REGION_SUPPORT,
    DEFAULT_ENABLE_TENANT_SCOPED_TOKENS,
    REDIRECT_OAUTH_PARAMS_NAME,
    REDIRECT_PARAMS_STORAGE_NAME,
    REDIRECT_PATH_PARAMS_NAME,
    USER_PARAMS_STORAGE_NAME
} from '../splunk-auth-client-settings';
import { StorageManager } from '../storage/storage-manager';
import {
    validateOAuthParameters,
    validateSearchParameters,
    validateStateParameters
} from '../validator/pkce-param-validators';
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
     * @param tenant Tenant.
     * @param region Region.
     */
    public constructor(
        authHost: string,
        clientId: string,
        redirectUri: string,
        tenant: string,
        region: string,
        redirectParamsStorageName = REDIRECT_PARAMS_STORAGE_NAME,
        enableTenantScopedTokens = DEFAULT_ENABLE_TENANT_SCOPED_TOKENS,
        enableMultiRegionSupport = DEFAULT_ENABLE_MULTI_REGION_SUPPORT,
    ) {
        this.authHost = authHost;
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.tenant = tenant;
        this.region = region;
        this.redirectParamsStorageName = redirectParamsStorageName;
        this.enableTenantScopedTokens = enableTenantScopedTokens;
        this.enableMultiRegionSupport = enableMultiRegionSupport;
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

    /**
     * Tenant.
     */
    public tenant: string;

    /**
     * Region.
     */
    public region: string;

    /**
     * Return tenant scoped access tokens if set to true
     */
    public enableTenantScopedTokens: boolean;

    /**
     * Update auth host url to be tenant based if set to true
     */
    public enableMultiRegionSupport: boolean;
}

/**
 * PKCEOAuthRedirectParams.
 */
export interface PKCEOAuthRedirectParams {
    state: string;
    codeVerifier: string;
    codeChallenge: string;
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
        this._userParamsStorage = new StorageManager(USER_PARAMS_STORAGE_NAME);
        this._authProxy = new AuthProxy(this._settings.authHost);
    }

    private _settings: PKCEAuthManagerSettings;

    private _redirectParamsStorage: StorageManager;

    private _userParamsStorage: StorageManager;

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
     * Gets user state params from storage.
     */
    public getUserStateParameter(): UserState {
        try {
            return this._userParamsStorage.get();
        } catch {
            throw new SplunkAuthClientError('Unable to retrieve user params storage');
        }
    }

    /**
     * Gets an access token using the search parameters from a provided URL or window location
     * and stored OAuth parameters.  An underlying token API call is made to retrieve a new token.
     * @param url Url.
     */
    public async getAccessToken(url?: string): Promise<AccessToken> {
        const searchParameters = this.getSearchParameters(url);
        const storedOAuthParameters = this.getRedirectOAuthParameters();

        clearWindowLocationFragments();

        // decode the state parameter and store the user state in session storage
        const state = String(searchParameters.get('state'));
        this.decodeAndStoreUserStateParameters(state);
        const userState = this.getUserStateParameter();
        
        this._settings.tenant = this._settings.enableTenantScopedTokens ? userState.tenant : '';
        this._settings.region = userState.region;

        // overriding authProxy for with tenant based authHost for multi-region support
        if (this._settings.enableMultiRegionSupport) {
            this._authProxy = new AuthProxy(generateTenantBasedAuthHost(this._authProxy.host,
                                    this._settings.tenant, this._settings.region));
        }

        const acceptTos = userState.accept_tos ? userState.accept_tos : searchParameters.get('accept_tos');

        // call authproxy accessToken to get token
        let accessToken: AccessTokenResponse;
        const accessTokenError = 'Failed to retrieve access token from token endpoint.'
        try {
            accessToken = await this._authProxy.accessToken(
                this._settings.clientId,
                String(searchParameters.get('code')),
                storedOAuthParameters.codeVerifier,
                this._settings.redirectUri,
                this._settings.tenant,
                state,
                acceptTos?.toString());

            // throws an error if refresh token was not returned as part of the access token response
            if (!accessToken.refresh_token) {
                throw new SplunkOAuthError('Missing refresh token.');
            }

            // after successfully returning the access token clean up the
            // redirect oauth params and the inviteID and inviteTenant user params in storage
            this.deleteRedirectOAuthParameters();
            this.deleteStoredUserStateParameters('inviteID');
            this.deleteStoredUserStateParameters('inviteTenant');
        } catch (e) {
            if (e.message.includes(ERROR_CODE_UNSIGNED_TOS)) {
                throw new SplunkOAuthError(
                    accessTokenError,
                    ERROR_CODE_UNSIGNED_TOS
                );
            }
            this.deleteRedirectOAuthParameters();
            this.deleteStoredUserStateParameters('inviteID');
            this.deleteStoredUserStateParameters('inviteTenant');
            throw new SplunkOAuthError(`${accessTokenError} ${e.message}`);
        }

        return {
            accessToken: accessToken.access_token,
            expiresAt: accessToken.expires_in + Math.floor(Date.now() / 1000),
            expiresIn: accessToken.expires_in,
            tokenType: accessToken.token_type,
            scopes: accessToken.scope.split(' '),
            refreshToken: accessToken.refresh_token,
            tenant: this._settings.tenant
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

        const storedUserParameters = this.getUserStateParameter();
        const email = storedUserParameters && storedUserParameters.email || undefined;
        const tenant = this._settings.tenant || undefined;
        
        let authHost = this._settings.authHost;
        if (this._settings.enableMultiRegionSupport) {
            authHost = generateTenantBasedAuthHost(authHost, tenant, this._settings.region);
        }

        const oauthQueryParams = new Map([
            ['client_id', this._settings.clientId],
            ['code_challenge', pkceParamCodeChallenge],
            ['code_challenge_method', 'S256'],
            ['redirect_uri', this._settings.redirectUri || window.location.href],
            ['response_type', 'code'],
            ['state', generateRandomString(64)],
            ['nonce', generateRandomString(64)],
            ['max_age', undefined],
            ['scope', 'openid email profile offline_access'],
            ['encode_state', '1'],
            ['tenant', tenant],
            ['email', email],
        ]);

        if (additionalQueryParams) {
            additionalQueryParams.forEach((value, key) => {
                oauthQueryParams.set(key, value);
            });
        }

        const redirectStorageParams: PKCEOAuthRedirectParams = {
            state: String(oauthQueryParams.get('state')),
            codeVerifier: pkceParamCodeVerifier,
            codeChallenge: pkceParamCodeChallenge
        };
        this._redirectParamsStorage.set(JSON.stringify(redirectStorageParams), REDIRECT_OAUTH_PARAMS_NAME);

        const url = new URL(AuthProxy.PATH_AUTHORIZATION, authHost);
        const queryParameterString = generateQueryParameters(oauthQueryParams);

        return new URL(queryParameterString, url.href);
    }

    /**
     * Generates the Logout URL and clear user params saved in session storage.
     * @param redirectUrl Optional redirect URL.
     */
    public generateLogoutUrl(redirectUrl: string): URL {
        this._userParamsStorage.clear();

        let authHost = this._settings.authHost;
        if (this._settings.enableMultiRegionSupport) {
            authHost = generateTenantBasedAuthHost(authHost, this._settings.tenant, this._settings.region);
        }

        const url = new URL(AuthProxy.PATH_LOGOUT, authHost);
        const queryParameterString = `?redirect_uri=${encodeURIComponent(redirectUrl)}`;
        return new URL(queryParameterString, url);
    }

    /**
     * Generates the TOS URL.
     */
    public generateTosUrl(): URL {
        const storedOAuthParameters = this.getRedirectOAuthParameters();
        const storedUserParameters = this.getUserStateParameter();
        const email = storedUserParameters && storedUserParameters.email || undefined;
        const inviteID = storedUserParameters && storedUserParameters.inviteID || undefined;

        // when authenticating through the invite flow determined by the
        // presence of the inviteID, set the tenant to the invited tenant
        let tenant;
        if (inviteID) {
            tenant = storedUserParameters && storedUserParameters.inviteTenant || undefined;
        } else {
            tenant = this._settings.tenant || undefined;
        }

        let authHost = this._settings.authHost;
        let region;
        if (this._settings.enableMultiRegionSupport) {
            authHost = generateRegionBasedAuthHost(authHost, this._settings.region);
            region = `region-${this._settings.region}`;
        }

        const oauthQueryParams = new Map([
            ['client_id', this._settings.clientId],
            ['code_challenge', storedOAuthParameters.codeChallenge],
            ['code_challenge_method', 'S256'],
            ['redirect_uri', this._settings.redirectUri || window.location.href],
            ['response_type', 'code'],
            ['state', storedOAuthParameters.state],
            ['scope', 'openid email profile offline_access'],
            ['encode_state', '1'],
            ['tenant', tenant],
            ['email', email],
            ['inviteID', inviteID],
            ['region', region]
        ]);

        const url = new URL(AuthProxy.PATH_TOS, authHost);
        const queryParameterString = generateQueryParameters(oauthQueryParams);

        return new URL(queryParameterString, url.href);
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

    private deleteRedirectOAuthParameters() {
        try {
            this._redirectParamsStorage.delete(REDIRECT_OAUTH_PARAMS_NAME);
        } catch (e) {
            throw new SplunkAuthClientError(`Failed to remove the ${REDIRECT_OAUTH_PARAMS_NAME} data. ${e.message}`);
        }
    }

    private deleteStoredUserStateParameters(key?: string) {
        try {
            this._userParamsStorage.delete(key);
        } catch (e) {
            throw new SplunkAuthClientError(`Failed to remove the ${key} data from the user storage. ${e.message}`);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    private decodeAndStoreUserStateParameters(state: string) {
        let userState: UserState
        try {
            userState = JSON.parse(decodeURIComponent(state));
            // strip out the region prefix
            userState.region = userState.region.replace('region-', '');
        } catch {
            throw new SplunkAuthClientError('Unable to parse state parameter to get user state');
        }
        validateStateParameters(userState);

        // store the user state parameters into storage
        this._userParamsStorage.set(userState);
    }
}
