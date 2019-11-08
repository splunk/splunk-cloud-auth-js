/**
 * Copyright 2019 Splunk, Inc.
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

import { AuthManager } from '@splunkdev/cloud-sdk/auth_manager';
import { Buffer } from 'buffer';
import { AuthManagerSettings, BaseAuthManager, HEADERS_APPLICATION_JSON_URLENCODED } from './base_auth_manager';
import { SplunkAuthError } from './splunk_auth_error';

import 'isomorphic-fetch';

const MILLISECONDS_IN_SECOND = 1000;
const TOKEN_EXPIRY_BUFFER_MILLISECONDS = 30000;

/**
 * ClientAuthManagerSettings.
 */
export class ClientAuthManagerSettings extends AuthManagerSettings {
    public clientSecret: string;
    public grantType: string = 'client_credentials';

    /**
     * ClientAuthManagerSettings.
     * @param host Host.
     * @param scope Scope.
     * @param clientId Client Id.
     * @param clientSecret Client secret.
     * @param grantType Grant type.
     */
    constructor(host: string, scope: string, clientId: string, clientSecret: string, grantType: string) {
        super(host, scope, clientId);

        this.clientSecret = clientSecret;
        this.grantType = grantType;
    }
}

/**
 * ClientAuthManager enables authentication with Splunk Cloud Services services using client credentials.
 */
export class ClientAuthManager extends BaseAuthManager<ClientAuthManagerSettings> implements AuthManager {
    /**
     * ClientAuthManager constructor.
     * @param authSettings ClientAuthManagerSettings.
     */
    constructor(authSettings: ClientAuthManagerSettings) {
        super(authSettings);
    }

    /**
     * Checks whether the client is authenticated by checking for a token and comparing against the expiration time.
     */
    public isAuthenticated(): boolean {
        if (this.authContext.accessToken && this.authContext.tokenExpiration > new Date().getTime()) {
            return true;
        }
        return false;
    }

    /**
     * Gets the access token.
     * Calls will only be made to the auth endpoint when token is no longer authenticated or it is about to expire.
     */
    public getAccessToken(): Promise<string> {
        // allow for a 30 second buffer to trigger access token update.
        if (this.isAuthenticated() && this.authContext.tokenExpiration > new Date().getTime() + TOKEN_EXPIRY_BUFFER_MILLISECONDS) {
            return new Promise<string>((resolve) => resolve(this.authContext.accessToken));
        }

        if (!this.authSettings.clientId) {
            throw new SplunkAuthError('clientId is not specified.');
        }

        if (!this.authSettings.clientSecret) {
            throw new SplunkAuthError('clientSecret is not specified.');
        }

        if (!this.authSettings.grantType) {
            throw new SplunkAuthError('grantType is not specified.');
        }

        const authEncoded = Buffer.from(`${this.authSettings.clientId}:${this.authSettings.clientSecret}`).toString('base64');
        const headers = {
            ...{
                Authorization: `Basic ${authEncoded}`
            },
            ...HEADERS_APPLICATION_JSON_URLENCODED
        };
        const tokenUrl = new URL(this.PATH_TOKEN, this.authSettings.host);
        const body: Map<string, any> = new Map([
            ['grant_type', this.authSettings.grantType],
            ['scope', this.authSettings.scope]
        ]);
        let formUrlEncodedBody: string = '';
        body.forEach((value, key) => {
            formUrlEncodedBody += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
        });

        return fetch(tokenUrl.href, {
            headers,
            body: formUrlEncodedBody,
            method: 'POST'
        })
        .then(res => res.json())
        .then(json => {
            if (!json.access_token) {
                throw new SplunkAuthError(`Unable to authenticate and retrieve access_token. ErrorCode=${json.code}`);
            }

            this.authContext.tokenExpiration = new Date().getTime() + json.expires_in * MILLISECONDS_IN_SECOND;
            this.authContext.tokenType = json.token_type;
            this.authContext.accessToken = json.access_token;
            this.authContext.idToken = json.id_token;
            this.authContext.scope = json.scope;

            return json.access_token;
        });
    }
}
