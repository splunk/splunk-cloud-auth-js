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

import 'buffer';

import { AuthManagerSettings, AuthProxy, BaseAuthManager, SplunkAuthError } from '@splunkdev/cloud-auth-common';
import { AuthManager } from '@splunkdev/cloud-sdk/src/auth_manager';
import { createHash, randomBytes } from 'crypto';

const MILLISECONDS_IN_SECOND = 1000;
const TOKEN_EXPIRY_BUFFER_MILLISECONDS = 30000;
const DEFAULT_CODE_VERIFIER_LENGTH = 50;

/**
 * PKCECodeFlowHelper.
 */
export class PKCECodeFlowHelper {

    /**
     * Creates a code challenge.
     * A code challenge is derived from the code verifier by the following transformation:
     * BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
     * IETF reference: https://tools.ietf.org/html/rfc7636#section-4.2
     * @param codeVerifier Code verifier.
     */
    public static createCodeChallenge(codeVerifier: string): string {
        const buffer = createHash('sha256').update(codeVerifier).digest();
        return PKCECodeFlowHelper.base64URLEncode(buffer);
    }

    /**
     * Creates a code verifier.
     * A code verifier is a high-entropy cryptographic random STRING usig the
     * unreserved characters [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
     * from Section 2.3 of [RFC3986], with a minimum length of 43 characters
     * and a maximum length of 128 characters.
     * IETF reference: https://tools.ietf.org/html/rfc7636#section-4.1
     * @param codeVerifierLength number between 43 and 128 inclusive representing the length of chars
     *                           for the generated code verifier.
     */
    public static createCodeVerifier(codeVerifierLength: number): string {
        if (!codeVerifierLength || codeVerifierLength < 43 || codeVerifierLength > 128) {
            throw new SplunkAuthError(`Specified code verifier length is invalid. len=${codeVerifierLength}`);
        }

        const buffer = randomBytes(codeVerifierLength);
        return PKCECodeFlowHelper.base64URLEncode(buffer);
    }

    private static base64URLEncode(buffer: Buffer): string {
        return Buffer.from(buffer).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
}

/**
 * PKCEAuthManagerSettings.
 */
export class PKCEAuthManagerSettings extends AuthManagerSettings {

    /**
     * Password.
     */
    public password: string;

    /**
     * Redirect URI.
     */
    public redirectUri: string;

    /**
     * User name.
     */
    public username: string;

    /**
     * PKCEAuthManagerSettings.
     * @param host Host.
     * @param scope Scope.
     * @param clientId Client Id.
     * @param redirectUri Redirect Uri.
     * @param username Username.
     * @param password Password.
     */
    constructor(
        host: string,
        scope = 'openid offline_access email profile',
        clientId: string,
        redirectUri: string,
        username: string,
        password: string) {
        super(host, scope, clientId);

        this.redirectUri = redirectUri;
        this.username = username;
        this.password = password;
    }
}

/**
 * PKCEAuthManager enables authentication with Splunk Cloud Services services using PKCE.
 * IETF Reference: https://tools.ietf.org/html/rfc7636
 */
export class PKCEAuthManager extends BaseAuthManager<PKCEAuthManagerSettings> implements AuthManager {

    /**
     * PKCEAuthManager constructor.
     * @param authSettings PKCEAuthManagerSettings.
     * @param authProxy: Authorization Proxy.
     */
    constructor(
        authSettings: PKCEAuthManagerSettings,
        authProxy?: AuthProxy
    ) {
        super(authSettings);
        this.authProxy = authProxy || new AuthProxy(authSettings.host);
    }

    private authProxy: AuthProxy;

    /**
     * Gets the access token.
     * Calls will only be made to the auth endpoint when token is no longer authenticated or it is about to expire.
     */
    public async getAccessToken(): Promise<string> {

        // allow for a 30 second buffer to trigger access token update.
        if (this.authContext.accessToken
            && this.authContext.tokenExpiration > new Date().getTime() + TOKEN_EXPIRY_BUFFER_MILLISECONDS) {
            return new Promise<string>((resolve) => resolve(this.authContext.accessToken));
        }

        if (!this.authSettings.clientId) {
            throw new SplunkAuthError('clientId is not specified.');
        }

        if (!this.authSettings.redirectUri) {
            throw new SplunkAuthError('redirectUri is not specified.');
        }

        // get session token.
        const csrfTokenResponse = await this.authProxy.csrfToken();
        const sessionToken = await this.authProxy.sessionToken(
            this.authSettings.username,
            this.authSettings.password,
            csrfTokenResponse.csrfToken,
            csrfTokenResponse.cookies);

        // generate code verifier and code challenge.
        const codeVerifier = PKCECodeFlowHelper.createCodeVerifier(DEFAULT_CODE_VERIFIER_LENGTH);
        const codeChallenge = PKCECodeFlowHelper.createCodeChallenge(codeVerifier);

        // get authorization code.
        const authCode = await this.authProxy.authorizationCode(
            this.authSettings.clientId,
            codeChallenge,
            'S256',
            'none',
            this.authSettings.redirectUri,
            'code',
            this.authSettings.scope,
            sessionToken,
            (new Date().getTime() / MILLISECONDS_IN_SECOND).toString()
        );

        // get access token.
        const accessTokenResponse = await this.authProxy.accessToken(
            this.authSettings.clientId,
            authCode,
            codeVerifier,
            this.authSettings.redirectUri);
        this.authContext.tokenExpiration =
            new Date().getTime() + accessTokenResponse.expires_in * MILLISECONDS_IN_SECOND;
        this.authContext.tokenType = accessTokenResponse.token_type;
        this.authContext.accessToken = accessTokenResponse.access_token;
        this.authContext.refreshToken = accessTokenResponse.refresh_token;
        this.authContext.idToken = accessTokenResponse.id_token;
        this.authContext.scope = accessTokenResponse.scope;

        return this.authContext.accessToken;
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
}
