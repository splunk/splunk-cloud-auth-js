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
import { generateRandomString } from '../common/util';
import { AccessToken } from '../model/access-token';
import { TOKEN_STORAGE_NAME } from '../splunk-auth-client-settings';
import { StorageManager } from '../storage/storage-manager';

const DEFAULT_TOKEN_STORAGE_KEY = 'default';
const TENANT_TOKEN_STORAGE_KEY = 'tenant';

/**
 * TokenManagerSettings.
 */
export class TokenManagerSettings {
    /**
     * TokenManagerSettings constructor.
     * @param authHost Authorize Host.
     * @param autoTokenRenewalBuffer Auto token renewal buffer.
     * @param clientId Client Id.
     * @param redirectUri Redirect URI.
     * @param storageName Storage name.
     * @param tenant Tenant.
     */
    public constructor(
        authHost: string,
        autoTokenRenewalBuffer: number,
        clientId: string,
        redirectUri: string,
        storageName: string = TOKEN_STORAGE_NAME,
        tenant?: string,
    ) {
        this.authHost = authHost;
        this.autoTokenRenewalBuffer = autoTokenRenewalBuffer;
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.storageName = storageName === '' ? TOKEN_STORAGE_NAME : storageName;
        this.tenant = tenant || '';
    }

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
     * Tenant.
     */
    public tenant: string;
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
     * 
     * Token refresh is not supported for tenant specific access tokens.
     */
    public set(accessToken: AccessToken): void {
        const tenant = this._settings.tenant;
        if (tenant) {
            let tenantTokens;
            tenantTokens = this._storage.get(TENANT_TOKEN_STORAGE_KEY);
            if (tenantTokens === undefined) {
                tenantTokens = {};
            }
            tenantTokens[tenant] = accessToken;
            this._storage.set(tenantTokens, TENANT_TOKEN_STORAGE_KEY);
            return;
        }

        this._storage.set(accessToken, DEFAULT_TOKEN_STORAGE_KEY);

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
            this.refreshToken();
        }, refreshTime);
    }

    /**
     * Gets the access token from storage.
     * 
     * If a tenant is defined and in storage return the tenant access token.
     * Otherwise return the default access token.
     */
    public get(): AccessToken {
        const tenant = this._settings.tenant;
        const defaultToken = this._storage.get(DEFAULT_TOKEN_STORAGE_KEY);
        // check if tenant is defined and in storage
        if (tenant) {
            const tenantTokens = this._storage.get(TENANT_TOKEN_STORAGE_KEY);
            return tenantTokens && tenantTokens[tenant] || defaultToken;
        }
        return defaultToken;
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
    public async refreshToken(): Promise<void> {
        this._authProxy.authorizationToken(
            this._settings.clientId,
            '',
            generateRandomString(64),
            this._settings.redirectUri || window.location.href,
            'json',
            'token id_token',
            'openid email profile',
            generateRandomString(64)
        ).then((response: any) => {
            const accessToken: AccessToken = {
                accessToken: response.access_token,
                expiresAt: Number(response.expires_in) + Math.floor(Date.now() / 1000),
                expiresIn: Number(response.expires_in),
                tokenType: response.token_type
            };
            this.set(accessToken);
        }).catch((err: any) => {
            Logger.warn(err);
        });
    }
}
