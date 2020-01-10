/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

import config from './config';
import AuthClientError from './errors/AuthClientError';
import StorageManager from './storage';
import token from './token';
import { isValidTokenObject, warn } from './util';

class TokenManager extends StorageManager {
    constructor(client) {
        super(config.TOKEN_STORAGE_NAME);
        this.client = client;
    }

    add = (key, authToken) => {
        const tokenStorage = this.storage.getStorage();
        if (!isValidTokenObject(authToken)) {
            throw new AuthClientError(
                'Token must be an Object with scopes, expiresAt, and an idToken or accessToken properties'
            );
        }
        tokenStorage[key] = authToken;
        this.storage.setStorage(tokenStorage);
        // expiresIn is in seconds but we need milliseconds
        const renewalBuffer =
            this.client.options.autoTokenRenewalBuffer || config.DEFAULT_AUTO_TOKEN_RENEWAL_BUFFER;
        const refreshTime = authToken.expiresIn * 1000 - renewalBuffer * 1000;
        setTimeout(this.refreshToken, refreshTime);
    };

    refreshToken = () => {
        const authUrl = `${token.getAuthUrl(this.client)}&response_mode=json`;

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
