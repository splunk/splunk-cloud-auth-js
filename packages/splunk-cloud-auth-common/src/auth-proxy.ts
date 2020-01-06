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

import 'isomorphic-fetch';
import { SplunkAuthError } from './splunk-auth-error';

const HEADERS_APPLICATION_JSON = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

const HEADERS_APPLICATION_JSON_URLENCODED = {
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
     * Gets an authorization code for PKCE auth flow.
     * IETF Reference: https://tools.ietf.org/html/rfc7636#section-4.3, https://tools.ietf.org/html/rfc7636#section-4.4
     * @param clientId Client Id.
     * @param codeChallenge Code challenge.
     * @param codeChallengeMethod Code challenge method.
     * @param nonce Nonce.
     * @param redirectUri Redirect Uri.
     * @param responseType Response type.
     * @param scope Scope.
     * @param sessionToken Session token.
     * @param state State.
     */
    public async authorizationCode(
        clientId: string,
        codeChallenge: string,
        codeChallengeMethod: string = 'S256',
        nonce: string = 'none',
        redirectUri: string,
        responseType: string = 'code',
        scope: string,
        sessionToken: string,
        state: string): Promise<string> {
        const queryParamMap: Map<string, any> = new Map([
            ['client_id', clientId],
            ['code_challenge', codeChallenge],
            ['code_challenge_method', codeChallengeMethod],
            ['nonce', nonce],
            ['redirect_uri', redirectUri],
            ['response_type', responseType],
            ['scope', scope],
            ['session_token', sessionToken],
            ['state', state]
        ]);
        let queryParamString: string = '?';
        queryParamMap.forEach((value, key) => {
            queryParamString += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
        });

        const authorizeBaseUrl = new URL(this.PATH_AUTHORIZATION, this.host);
        const authorizeUrl = new URL(queryParamString, authorizeBaseUrl.href);
        return fetch(
            authorizeUrl.href,
            {
                headers: HEADERS_APPLICATION_JSON,
                method: 'GET'
            })
            .then(res => {
                if (res.status !== 200) {
                    throw new SplunkAuthError(
                        `authorization call failed with status='${res.status}', statusText='${res.statusText}'`);
                }

                const codeUrl = new URL(res.url);
                const code = codeUrl.searchParams.get('code');
                if (!code) {
                    throw new SplunkAuthError(`Unable to retrieve authorization code from Authorize response URL.`);
                }
                return code.toString();
            });
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

    /**
     * Gets a CSRF token to be passed to the (extended) 'primary' endpoint (/authn) for PKCE auth flow.
     */
    public async csrfToken(): Promise<CsrfTokenResponse> {
        let cookie: any;
        const csrfTokenurl = new URL(this.PATH_TOKEN_CSRF, this.host);
        return fetch(
            csrfTokenurl.href,
            {
                headers: HEADERS_APPLICATION_JSON,
                method: 'GET'
            })
            .then(res => {
                if (res.status !== 200) {
                    throw new SplunkAuthError(
                        `CSRF token call failed with status='${res.status}', statusText='${res.statusText}'`);
                }
                cookie = res.headers.get('set-cookie');
                return res.json();
            })
            .then(json => {
                if (!json.csrf) {
                    throw new SplunkAuthError(`Unable to retrieve CSRF token from csrfToken endpoint.`);
                }
                return new CsrfTokenResponse(json.csrf, cookie);
            });
    }

    /**
     * Retrieves an access token using refresh token.
     * @param clientId Client id.
     * @param clientSecret Client secret.
     * @param grantType Grant type.
     * @param scope Scope.
     */
    public async refreshAccessToken(
        clientId: string,
        grantType: string = 'refresh_token',
        scope: string,
        refreshToken: string
    ): Promise<AccessTokenResponse> {
        const body: Map<string, any> = new Map([
            ['client_id', clientId],
            ['grant_type', grantType],
            ['refresh_token', refreshToken],
            ['scope', scope],
        ]);

        return this._token(HEADERS_APPLICATION_JSON_URLENCODED, body);
    }

    /**
     * Authenticates user and returns a session token for PKCE auth flow.
     * @param username User name.
     * @param password Password.
     * @param csrfToken CSRF token.
     * @param cookies Cookies.
     */
    public async sessionToken(
        username: string,
        password: string,
        csrfToken: string,
        cookies: string): Promise<string> {
        const headers = {
            ...HEADERS_APPLICATION_JSON,
            Cookie: `${cookies}`
        };
        const body = JSON.stringify({
            password,
            username,
            csrftoken: csrfToken
        });

        const authnUrl = new URL(this.PATH_AUTHN, this.host);
        return fetch(
            authnUrl.href,
            {
                body,
                headers,
                method: 'POST'
            })
            .then(res => {
                if (res.status !== 200) {
                    throw new SplunkAuthError(
                        `Authn call failed with status='${res.status}', statusText='${res.statusText}'`);
                }
                return res.json();
            })
            .then(json => {
                if (json.status !== 'SUCCESS') {
                    throw new SplunkAuthError(`User authentication failed with status='${json.status}'`);
                }
                if (!json.sessionToken) {
                    throw new SplunkAuthError(`Unable to retrieve sessionToken from authn endpoint.`);
                }
                return json.sessionToken;
            });
    }

    private async _token(headers: any, body: Map<string, any>): Promise<AccessTokenResponse> {
        const tokenUrl = new URL(this.PATH_TOKEN, this.host);
        let formUrlEncodedBody: string = '';
        body.forEach((value, key) => {
            formUrlEncodedBody += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
        });

        return fetch(
            tokenUrl.href,
            {
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

/**
 * CsrfTokenResponse.
 */
export class CsrfTokenResponse {

    /**
     * Cookies.
     */
    public cookies: any;
    /**
     * CSRF token.
     */
    public csrfToken: string;

    /**
     * CsrfTokenResponse constructor.
     * @param csrfToken CSRF token.
     * @param cookies Cookies.
     */
    constructor(csrfToken: string, cookies: any) {
        this.csrfToken = csrfToken;
        this.cookies = cookies;
    }
}
