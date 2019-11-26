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

'use strict';

import 'node-fetch';
import { SplunkAuthError } from './splunk-auth-error';

export const HEADERS_APPLICATION_JSON = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

export const HEADERS_APPLICATION_JSON_URLENCODED = {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded'
};

/**
 * Authorization Proxy.
 */
export class AuthProxy {
    /**
     * AuthProxy constructor.
     * @param host Host.
     */
    public constructor(host: string) {
        this.host = host;
    }

    private host: string;
    private readonly PATH_AUTHN: string = '/authn';
    private readonly PATH_AUTHORIZATION: string = '/authorize';
    private readonly PATH_TOKEN: string = '/token';
    private readonly PATH_TOKEN_CSRF: string = '/csrfToken';

    /**
     * Retrieves an access token using auth code and code verifier.
     * IETF Reference: https://tools.ietf.org/html/rfc7636#section-4.5
     * @param clientId Client Id.
     * @param authCode Authorization code.
     * @param codeVerifier Code verifier.
     * @param redirectUri Redirect URI.
     */
    public async accessToken(
        clientId: string,
        authCode: string,
        codeVerifier: string,
        redirectUri: string): Promise<AccessTokenResponse> {
        const body: Map<string, any> = new Map([
            ['grant_type', 'authorization_code'],
            ['client_id', clientId],
            ['code', authCode],
            ['code_verifier', codeVerifier],
            ['redirect_uri', redirectUri]
        ]);

        return this._token(HEADERS_APPLICATION_JSON_URLENCODED, body);
    }

    /**
     * Retrieves an access token using client credentials.
     * @param clientId Client id.
     * @param clientSecret Client secret.
     * @param grantType Grant type.
     * @param scope Scope.
     */
    public async clientAccessToken(
        clientId: string,
        clientSecret: string,
        grantType: string,
        scope: string
    ): Promise<AccessTokenResponse> {
        const authEncoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const headers = Object.assign(
            {
                Authorization: `Basic ${authEncoded}`
            },
            HEADERS_APPLICATION_JSON_URLENCODED);
        const body: Map<string, any> = new Map([
            ['grant_type', grantType],
            ['scope', scope]
        ]);

        return this._token(headers, body);
    }

    private async _token(headers: any, body: Map<string, any>): Promise<AccessTokenResponse> {
        const tokenUrl = new URL(this.PATH_TOKEN, this.host);
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
                    throw new SplunkAuthError(
                        `Unable to authenticate and retrieve access_token. ErrorCode='${json.code}'`);
                }

                return json;
            });
    }
}

/**
 * AccessTokenResponse.
 */
export interface AccessTokenResponse {
    access_token: string;
    expires_in: number;
    id_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
}
