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

import { TOKEN_STORAGE_NAME } from './auth-client-settings';
import { Logger } from './common/logger';
import { generateRandomString } from './common/util';
import { StorageManager } from './storage/storage-manager';

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
     */
    public constructor(
        authHost: string,
        autoTokenRenewalBuffer: number,
        clientId: string,
        redirectUri: string,
        storageName: string = TOKEN_STORAGE_NAME
    ) {
        this.authHost = authHost;
        this.autoTokenRenewalBuffer = autoTokenRenewalBuffer;
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.storageName = storageName === '' ? TOKEN_STORAGE_NAME : storageName;
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
}

/**
 * AccessToken interface.
 */
export interface AccessToken {
    /**
     * Access token string.
     */
    accessToken: string;

    /**
     * Expires at.
     */
    expiresAt: number;

    /**
     * Expiration duration.
     */
    expiresIn: number;

    /**
     * Token type.
     */
    tokenType: string;

    /**
     * Scopes.
     */
    scopes?: string[];
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
        this._storage.set(accessToken, 'accessToken');

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
     */
    public get(): AccessToken {
        return this._storage.get('accessToken');
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
