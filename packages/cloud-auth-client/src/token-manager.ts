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

import { TOKEN_STORAGE_NAME } from './auth-client-settings';
import { StorageManager } from './storage/storage-manager';
import token from './token';
import { warn } from './util';

/**
 * TokenManagerSettings.
 */
export class TokenManagerSettings {
    /**
     * TokenManagerSettings constructor.
     * @param clientId Client Id.
     * @param redirectUri Redirect URI.
     * @param authorizeUrl Authorize URL.
     * @param autoTokenRenewalBuffer Auto token renewal buffer.
     * @param storageName Storage name.
     */
    public constructor(
        clientId: string,
        redirectUri: string,
        authorizeUrl: string,
        autoTokenRenewalBuffer: number,
        storageName: string = TOKEN_STORAGE_NAME
    ) {
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.authorizeUrl = authorizeUrl;
        this.autoTokenRenewalBuffer = autoTokenRenewalBuffer;
        this.storageName = storageName === '' ? TOKEN_STORAGE_NAME : storageName;
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
     * Authorize URL.
     */
    public authorizeUrl: string;

    /**
     * Auto token renewal buffer.
     */
    public autoTokenRenewalBuffer: number;

    /**
     * Storage name.
     */
    public storageName: string;
}

/**
 * AccessToken interface.
 */
export interface AccessToken {
    accessToken: string;
    expiresAt: number;
    expiresIn: number;
    tokenType: string;
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
        this.settings = settings;
        this.storage = new StorageManager(this.settings.storageName);
    }

    private settings: TokenManagerSettings;

    private storage: StorageManager;

    /**
     * Puts the access token in storage.
     */
    public set(accessToken: AccessToken): void {
        this.storage.set(accessToken, 'accessToken');

        // expiresIn is in seconds but we need milliseconds.
        const renewalBuffer = this.settings.autoTokenRenewalBuffer;
        const refreshTime = accessToken.expiresIn * 1000 - renewalBuffer * 1000;

        // trigger auto-refresh.
        setTimeout(this.refreshToken, refreshTime);
    }

    /**
     * Gets the access token from storage.
     */
    public get(): any {
        return this.storage.get('accessToken');
    }

    /**
     * Clears the access token in storage.
     */
    public clear() {
        this.storage.clear();
    }

    /**
     * Refresh Token.
     */
    public refreshToken(): void {
        const authUrl =
            `${token.getAuthUrl(
                this.settings.clientId, this.settings.redirectUri, this.settings.authorizeUrl)}&response_mode=json`;

        fetch(authUrl, { credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                const accessToken = {
                    accessToken: data.access_token,
                    expiresAt: Number(data.expires_in) + Math.floor(Date.now() / 1000),
                    expiresIn: Number(data.expires_in),
                    tokenType: data.token_type
                };

                this.set(accessToken);
            })
            .catch(err => {
                warn(err);
            });
    }
}
