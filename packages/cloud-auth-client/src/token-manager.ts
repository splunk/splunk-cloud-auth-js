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
import { AuthClientError } from './errors/auth-client-error';
import StorageManager from './storage';
import token from './token';
import { isValidTokenObject, warn } from './util';

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
 * TokenManager.
 */
export class TokenManager extends StorageManager {

    /**
     * TokenManager.
     * @param settings TokenManagerSettings.
     */
    constructor(settings: TokenManagerSettings) {
        super(settings.storageName);
        this.settings = settings;
    }

    private settings: TokenManagerSettings;

    /**
     * Add.
     */
    add = (key: string, authToken: string) => {
        const tokenStorage = this.storage.getStorage();
        if (!isValidTokenObject(authToken)) {
            throw new AuthClientError(
                'Token must be an Object with scopes, expiresAt, and an idToken or accessToken properties'
            );
        }
        tokenStorage[key] = authToken;
        this.storage.setStorage(tokenStorage);
        // expiresIn is in seconds but we need milliseconds
        const renewalBuffer = this.settings.autoTokenRenewalBuffer;
        const refreshTime = authToken.expiresIn * 1000 - renewalBuffer * 1000;
        setTimeout(this.refreshToken, refreshTime);
    };

    /**
     * Refresh Token.
     */
    refreshToken = () => {
        const authUrl =
            `${token.getAuthUrl(
                this.settings.clientId, this.settings.redirectUri, this.settings.authorizeUrl)}&response_mode=json`;

        fetch(authUrl, { credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                const accessToken = {
                    accessToken: data.access_token,
                    expiresAt: Number(data.expires_in) + Math.floor(Date.now() / 1000),
                    expiresIn: data.expires_in,
                    tokenType: data.token_type,
                };

                this.add('accessToken', accessToken);
            })
            .catch(err => {
                warn(err);
            });
    };
}

export default TokenManager;
