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

import 'isomorphic-fetch';

import cookieParser from 'set-cookie-parser';

import { SplunkAuthError } from './splunk-auth-error';
import { generateQueryParameters } from './util';

const HEADERS_APPLICATION_JSON = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

const HEADERS_APPLICATION_JSON_URLENCODED = {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded'
};

/**
 * AccessTokenResponse.
 */
/* eslint-disable camelcase */
export interface AccessTokenResponse {
    access_token: string;
    expires_in: number;
    id_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
}
/* eslint-enable camelcase */

/**
 * AuthorizationTokenResponse.
 */
/* eslint-disable camelcase */
export interface AuthorizationTokenResponse {
    access_token: string;
    expires_in: number;
    id_token: string;
    scope: string;
    token_type: string;
}
/* eslint-enable camelcase */

/**
 * CsrfTokenResponse.
 */
export interface CsrfTokenResponse {

    /**
     * Cookies.
     */
    cookies: any;

    /**
     * CSRF token.
     */
    csrfToken: string;
}

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

    public host: string;

    public static readonly PATH_AUTHN: string = '/authn';

    public static readonly PATH_AUTHORIZATION: string = '/authorize';

    public static readonly PATH_LOGOUT: string = '/logout';

    public static readonly PATH_TOKEN: string = '/token';

    public static readonly PATH_TOKEN_CSRF: string = '/csrfToken';

    public static readonly PATH_TOS: string = '/tos';

    /**
     * Retrieves an access token using auth code and code verifier.
     * IETF Reference: https://tools.ietf.org/html/rfc7636#section-4.5
     * @param clientId Client Id.
     * @param authCode Authorization code.
     * @param codeVerifier Code verifier.
     * @param redirectUri Redirect URI.
     * @param tenant Tenant.
     * @param state State.
     * @param acceptTos Accepted TOS.
     */
    public async accessToken(
        clientId: string,
        authCode: string,
        codeVerifier: string,
        redirectUri: string,
        tenant: string,
        state?: string,
        acceptTos?: string): Promise<AccessTokenResponse> {
        const body: Map<string, any> = new Map([
            ['grant_type', 'authorization_code'],
            ['client_id', clientId],
            ['code', authCode],
            ['code_verifier', codeVerifier],
            ['redirect_uri', redirectUri]
        ]);
        if (state) {
            body.set('state', state);
        }
        if (acceptTos) {
            body.set('accept_tos', acceptTos);
        }

        return this._token(HEADERS_APPLICATION_JSON_URLENCODED, tenant, body);
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
        codeChallengeMethod = 'S256',
        nonce = 'none',
        redirectUri: string,
        responseType = 'code',
        scope: string,
        sessionToken: string,
        state: string): Promise<string> {
        const queryParameterMap = new Map([
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
        const queryParameterString = generateQueryParameters(queryParameterMap);
        const authorizeBaseUrl = new URL(AuthProxy.PATH_AUTHORIZATION, this.host);
        const authorizeUrl = new URL(queryParameterString, authorizeBaseUrl.href);
        return fetch(
            authorizeUrl.href,
            {
                headers: HEADERS_APPLICATION_JSON,
                method: 'GET'
            })
            .then(response => {
                if (response.status !== 200) {
                    throw new SplunkAuthError(
                        `authorization call failed with status='${response.status}', ` +
                        `statusText='${response.statusText}'`);
                }

                const codeUrl = new URL(response.url);
                const code = codeUrl.searchParams.get('code');
                if (!code) {
                    throw new SplunkAuthError(`Unable to retrieve authorization code from Authorize response URL.`);
                }
                return code.toString();
            });
    }

    /**
     * Gets an authorization token for PKCE auth flow.
     * @param clientId Client Id.
     * @param maxAge Max age.
     * @param nonce Nonce.
     * @param redirectUri Redirect URI.
     * @param responseMode Response mode.
     * @param responseType Response type.
     * @param scope Scope.
     * @param state State.
     */
    public async authorizationToken(
        clientId: string,
        maxAge: string,
        nonce: string,
        redirectUri: string,
        responseMode: string,
        responseType: string,
        scope: string,
        state: string
    ): Promise<AuthorizationTokenResponse> {
        const queryParameterMap = new Map([
            ['client_id', clientId],
            ['max_age', maxAge],
            ['nonce', nonce],
            ['redirect_uri', redirectUri],
            ['response_mode', responseMode],
            ['response_type', responseType],
            ['scope', scope],
            ['state', state]
        ]);
        const queryParameterString = generateQueryParameters(queryParameterMap);
        const authorizeBaseUrl = new URL(AuthProxy.PATH_AUTHORIZATION, this.host);
        const authorizeUrl = new URL(queryParameterString, authorizeBaseUrl.href);

        return fetch(
            authorizeUrl.href,
            {
                credentials: 'include',
                ...HEADERS_APPLICATION_JSON
            })
            .then(response => {
                if (response.status !== 200) {
                    throw new SplunkAuthError(
                        `authorization token call failed with status='${response.status}', ` +
                        `statusText='${response.statusText}'`);
                }
                return response.json();
            })
            .then(json => {
                if (!json.access_token) {
                    throw new SplunkAuthError(
                        `Unable to retrieve access_token from response.`);
                }

                return json;
            });
    }

    /**
     * Retrieves an access token using client credentials.
     * @param clientId Client id.
     * @param clientSecret Client secret.
     * @param grantType Grant type.
     * @param scope Scope.
     * @param tenant Tenant.
     */
    public async clientAccessToken(
        clientId: string,
        clientSecret: string,
        grantType: string,
        scope: string,
        tenant: string
    ): Promise<AccessTokenResponse> {
        const authEncoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const headers = {
            Authorization: `Basic ${authEncoded}`,
            ...HEADERS_APPLICATION_JSON_URLENCODED
        };
        const body: Map<string, any> = new Map([
            ['grant_type', grantType],
            ['scope', scope]
        ]);

        return this._token(headers, tenant, body);
    }

    /**
     * Gets a CSRF token to be passed to the (extended) 'primary' endpoint (/authn) for PKCE auth flow.
     */
    public async csrfToken(): Promise<CsrfTokenResponse> {
        const csrfTokenurl = new URL(AuthProxy.PATH_TOKEN_CSRF, this.host);
        return fetch(
            csrfTokenurl.href,
            {
                headers: HEADERS_APPLICATION_JSON,
                method: 'GET'
            })
            .then(response => {
                if (response.status !== 200) {
                    throw new SplunkAuthError(
                        `CSRF token call failed with status='${response.status}', statusText='${response.statusText}'`);
                }
                const cookies = response.headers.get('set-cookie');
                if (!cookies) {
                    throw new SplunkAuthError(`Unable to retrieve cookies from csrfToken endpoint.`);
                }
                const csrfCookie = cookieParser.parse(cookies, {
                    decodeValues: true,
                    map: true,
                }).csrf;
                if (!csrfCookie) {
                    throw new SplunkAuthError(`Unable to retrieve CSRF token cookie from csrfToken endpoint.`);
                }
                const data: CsrfTokenResponse = {
                    cookies,
                    csrfToken: csrfCookie.value
                };
                return data;
            });
    }

    /**
     * Retrieves an access token using refresh token.
     * @param clientId Client id.
     * @param clientSecret Client secret.
     * @param grantType Grant type.
     * @param scope Scope.
     * @param tenant Tenant.
     */
    public async refreshAccessToken(
        clientId: string,
        grantType = 'refresh_token',
        scope: string,
        refreshToken: string,
        tenant: string
    ): Promise<AccessTokenResponse> {
        const body: Map<string, any> = new Map([
            ['client_id', clientId],
            ['grant_type', grantType],
            ['refresh_token', refreshToken],
            ['scope', scope],
        ]);

        return this._token(HEADERS_APPLICATION_JSON_URLENCODED, tenant, body);
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

        const authnUrl = new URL(AuthProxy.PATH_AUTHN, this.host);
        return fetch(
            authnUrl.href,
            {
                body,
                headers,
                method: 'POST'
            })
            .then(response => {
                if (response.status !== 200) {
                    throw new SplunkAuthError(
                        `Authn call failed with status='${response.status}', statusText='${response.statusText}'`);
                }
                return response.json();
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

    /**
     * Retreives an access token.
     *      - Returns a tenant-scoped access token if the tenant is defined
     *      - Returns a global acccess token if the tenant is not defined
     * @param headers Request headers.
     * @param tenant Tenant name.
     * @param body Request body.
     */
    private async _token(headers: any, tenant: string, body: Map<string, any>): Promise<AccessTokenResponse> {
        let tokenPath;
        if (tenant) {
            tokenPath = `${tenant}${AuthProxy.PATH_TOKEN}`;
        } else {
            tokenPath = AuthProxy.PATH_TOKEN;
        }
        const tokenUrl = new URL(tokenPath, this.host);
        // remove the prefixed query "?" to convert the query params into form url
        let formUrlEncodedBody = generateQueryParameters(body);
        formUrlEncodedBody = formUrlEncodedBody.slice(1);

        return fetch(
            tokenUrl.href,
            {
                headers,
                body: formUrlEncodedBody,
                method: 'POST',
                credentials: 'include'
            })
            .then(response => response.json())
            .then(json => {
                if (!json.access_token) {
                    throw new SplunkAuthError(
                        'Unable to authenticate and retrieve access_token.' +
                        `Error='${json.error}' ErrorCode='${json.code}'`);
                }

                return json;
            });
    }
}
