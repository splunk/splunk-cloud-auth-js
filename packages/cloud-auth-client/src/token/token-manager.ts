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

import { Logger } from '../common/logger';
import { generateRandomString, generateTenantBasedAuthHost } from '../common/util';
import { AccessToken } from '../model/access-token';
import {
    DEFAULT_ENABLE_MULTI_REGION_SUPPORT,
    GrantType,
    TOKEN_STORAGE_NAME
} from '../splunk-auth-client-settings';
import { StorageManager } from '../storage/storage-manager';

const GLOBAL_TOKEN_STORAGE_KEY = 'global';
const TENANT_TOKEN_STORAGE_KEY = 'tenant';

/**
 * TokenManagerSettings.
 */
export class TokenManagerSettings {
    /**
     * TokenManagerSettings constructor.
     * @param grantType Grant Type.
     * @param authHost Authorize Host.
     * @param autoTokenRenewalBuffer Auto token renewal buffer.
     * @param clientId Client Id.
     * @param redirectUri Redirect URI.
     * @param storageName Storage name.
     */
    public constructor(
        grantType: GrantType,
        authHost: string,
        autoTokenRenewalBuffer: number,
        clientId: string,
        redirectUri: string,
        storageName: string = TOKEN_STORAGE_NAME,
        enableMultiRegionSupport = DEFAULT_ENABLE_MULTI_REGION_SUPPORT,
    ) {
        this.grantType = grantType;
        this.authHost = authHost;
        this.autoTokenRenewalBuffer = autoTokenRenewalBuffer;
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.storageName = storageName === '' ? TOKEN_STORAGE_NAME : storageName;
        this.enableMultiRegionSupport = enableMultiRegionSupport;
    }

    /**
     * Grant Type.
     */
    public grantType: GrantType;

    /**
     * Authorization Host.
     */
    public authHost: string;

    /**
     * Auto token renewal buffer.
     */
    public autoTokenRenewalBuffer: number;

    /**
     * Client Id.
     */
    public clientId: string;

    /**
     * Redirect URI.
     */
    public redirectUri: string;

    /**
     * Storage name.
     */
    public storageName: string;

    /**
     * Update auth host url to be tenant based if set to true
     */
    public enableMultiRegionSupport: boolean;
}

/**
 * TokenManager.
 */
export class TokenManager {

    /**
     * TokenManager.
     * @param settings TokenManagerSettings.
     */
    public constructor(settings: TokenManagerSettings) {
        this._settings = settings;
        this._storage = new StorageManager(this._settings.storageName);
        this._authProxy = new AuthProxy(this._settings.authHost);
    }

    private _settings: TokenManagerSettings;

    private _storage: StorageManager;

    private _authProxy: AuthProxy;

    private _autoRefreshFunction?: ReturnType<typeof setTimeout>;

    /**
     * Puts the access token in storage.
     */
    public set(accessToken: AccessToken): void {
        if (accessToken.tenant) {
            let tenantScopedTokens;
            
            tenantScopedTokens = this._storage.get(TENANT_TOKEN_STORAGE_KEY);
            if (tenantScopedTokens === undefined) {
                tenantScopedTokens = {};
            }
            
            tenantScopedTokens[accessToken.tenant] = accessToken;

            this._storage.set(tenantScopedTokens, TENANT_TOKEN_STORAGE_KEY);
        } else {
            // global access token
            this._storage.set(accessToken, GLOBAL_TOKEN_STORAGE_KEY);
        }

        if (this._settings.autoTokenRenewalBuffer <= 0) {
            return;
        }

        // clear existing auto-refresh
        if (this._autoRefreshFunction) {
            clearTimeout(this._autoRefreshFunction);
        }

        // expiresIn is in seconds but we need milliseconds.
        const renewalBuffer = this._settings.autoTokenRenewalBuffer;
        const refreshTime = (accessToken.expiresIn - renewalBuffer) * 1000;

        // set the auto-refresh interval
        this._autoRefreshFunction = setTimeout(() => {
            this.refreshToken(accessToken);
        }, refreshTime);
    }

    /**
     * Gets the access token from storage.
     * 
     * Returns the tenant-scoped access token if the tenant is defined
     * and available in the session storage.
     * 
     * Returns the globally-scoped access token if the tenant token 
     */
    public get(tenant: string | undefined): AccessToken {
        const globalToken = this._storage.get(GLOBAL_TOKEN_STORAGE_KEY);

        if (tenant) {
            const tenantScopedTokens = this._storage.get(TENANT_TOKEN_STORAGE_KEY);
            return tenantScopedTokens && tenantScopedTokens[tenant] || globalToken;
        }

        return globalToken;
    }

    /**
     * Clears the access token in storage.
     */
    public clear() {
        this._storage.clear();
    }

    /**
     * Refreshes the token.
     */
    public async refreshToken(accessToken: AccessToken): Promise<void> {
        if (this._settings.grantType === GrantType.PKCE) {
            const tenant = accessToken.tenant || '';

            if (this._settings.enableMultiRegionSupport) {
                this._authProxy = new AuthProxy(generateTenantBasedAuthHost(this._authProxy.host, tenant));
            }

            this._authProxy.refreshAccessToken(
                this._settings.clientId,
                'refresh_token',
                'openid email profile offline_access',
                String(accessToken.refreshToken),
                tenant
            ).then(response => {
                const token: AccessToken = {
                    accessToken: response.access_token,
                    expiresAt: Number(response.expires_in) + Math.floor(Date.now() / 1000),
                    expiresIn: Number(response.expires_in),
                    tokenType: response.token_type,
                    refreshToken: response.refresh_token,
                    tenant
                };
                this.set(token);
            }).catch((err: any) => {
                Logger.warn(err);
            });
        } else {
            this._authProxy.authorizationToken(
                this._settings.clientId,
                '',
                generateRandomString(64),
                this._settings.redirectUri || window.location.href,
                'json',
                'token id_token',
                'openid email profile',
                generateRandomString(64)
            ).then(response  => {
                const token: AccessToken = {
                    accessToken: response.access_token,
                    expiresAt: Number(response.expires_in) + Math.floor(Date.now() / 1000),
                    expiresIn: Number(response.expires_in),
                    tokenType: response.token_type
                };
                this.set(token);
            }).catch((err: any) => {
                Logger.warn(err);
            });
        }
    }
}
