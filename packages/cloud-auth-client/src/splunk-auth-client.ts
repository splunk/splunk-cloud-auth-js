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

import { AuthManager as SdkAuthManager } from '@splunkdev/cloud-sdk/src/auth_manager';
import get from 'lodash/get';
import memoize from 'lodash/memoize';

import { AuthManager } from './auth/auth-manager';
import { AuthManagerFactory } from './auth/auth-manager-factory';
import { Logger } from './common/logger';
import { clearWindowLocationFragments } from './common/util';
import { SplunkAuthClientError } from './error/splunk-auth-client-error';
import { ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND } from './error/splunk-oauth-error';
import { AccessToken } from './model/access-token';
import {
    GrantType,
    REDIRECT_PATH_PARAMS_NAME,
    SplunkAuthClientSettings,
} from './splunk-auth-client-settings';
import { TokenManager, TokenManagerSettings } from './token/token-manager';

/**
 * Error codes that can be handled for redirecting to login.
 */
export const REDIRECT_LOGIN_HANDLED_ERROR_CODES = new Set<string>([
    ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND,
]);

/**
 * SplunkAuthClient.
 */
export class SplunkAuthClient implements SdkAuthManager {
    /**
     * AuthClient constructor.
     * @param settings AuthClientSettings.
     */
    public constructor(settings: SplunkAuthClientSettings) {
        if (!Object.values(GrantType).some((value) => value === settings.grantType)) {
            throw new SplunkAuthClientError(
                `Missing valid value for required configuration option "grantType". ` +
                `Values=[${Object.values(GrantType)}]`
            );
        }

        if (!settings.clientId) {
            throw new SplunkAuthClientError('Missing required configuration option "clientId".');
        }

        this._settings = settings;
        this._settings.onRestorePath = this._settings.onRestorePath
            ? this._settings.onRestorePath
            : SplunkAuthClient.defaultRestorePath;

        this._settings.tenant = this.getTenantQueryForLogin() || '';

        this._tokenManager = new TokenManager(
            new TokenManagerSettings(
                this._settings.authHost,
                this._settings.autoTokenRenewalBuffer,
                this._settings.clientId,
                this._settings.redirectUri,
                this._settings.tokenStorageName,
                this._settings.tenant
            )
        );
        this._authManager = AuthManagerFactory.get(
            this._settings.grantType,
            this._settings.authHost,
            this._settings.clientId,
            this._settings.redirectUri,
            this._settings.redirectParamsStorageName
        );

        if (this._settings.autoRedirectToLogin) {
            setTimeout(() => this.getAccessTokenContext().catch(), 0);
        }
    }

    private _settings: SplunkAuthClientSettings;

    private _tokenManager: TokenManager;

    private _authManager: AuthManager;

    private _hasRequestedToken = false;

    /**
     * Gets the access token string.
     */
    public async getAccessToken(): Promise<string> {
        const accessTokenContext = await this.getAccessTokenContext();
        return accessTokenContext ? accessTokenContext.accessToken : '';
    }

    /**
     * Gets the full access token context including expiration and scope.
     *
     * If a token has been cached in the TokenManager and is still valid, this method returns the cached AccessToken.
     * If a token is not cached or is expired this method will attempt to retrieve, cache and return an AccessToken
     * from the Auth Host.
     *      - If token retrieval fails and autoRedirectToLogin is true, this method will redirect to the splunk cloud
     *        login page.  Once valid credentials have been entered, the browser will be redirected back to the
     *        previous page.
     *      - If token retrieval fails and autoRedirectToLogin is  false, this method will attempt to retrieve a
     *        new token.
     */
    public async getAccessTokenContext(): Promise<AccessToken | undefined> {
        try {
            if (this.isAuthenticated()) {
                return this._tokenManager.get();
            }

            const token = await this.requestToken();
            this._tokenManager.set(token);
            return this._tokenManager.get();
        } catch (e) {
            Logger.warn(e.toString());

            if (
                this._settings.autoRedirectToLogin &&
                REDIRECT_LOGIN_HANDLED_ERROR_CODES.has(e.code)
            ) {
                // The login method does a redirect to the login page.
                this.login();
                return undefined;
            }

            this._tokenManager.clear();
            throw e;
        } finally {
            // For applications such as SPAs where there may be multiple calls to this method,
            // it does not make sense to repeatedly clear the window location fragments and/or execute path restore.
            // The following code block executes only on the first invocation of this method.
            if (!this._hasRequestedToken) {
                this._hasRequestedToken = true;
                clearWindowLocationFragments();
                if (this._settings.restorePathAfterLogin) {
                    this.restorePathAfterLogin();
                }
            }
        }
    }

    /**
     * Explicitly clears the access token from storage.
     */
    public clearAccessToken() {
        this._tokenManager.clear();
    }

    /**
     * Checks whether the client is authenticated by checking for a token in storage
     * and comparing against the expiration time.
     */
    public isAuthenticated() {
        const accessToken = this._tokenManager.get();
        return (
            accessToken &&
            get(accessToken, 'expiresAt') + this._settings.maxClockSkew >
            Math.floor(new Date().getTime() / 1000)
        );
    }

    /* eslint-disable max-len */
    /**
     * Store window.location path information and initiate the Implicit Flow.
     * (see: https://developer.okta.com/authentication-guide/implementing-authentication/implicit#2-using-the-implicit-flow)
     *
     * If the user does not have an existing session, this will redirect to login Page. If they
     * have an existing session, or after they log in, they will be redirected back to the
     * `config.redirectUri` (or `window.location.href` if not specified) and any tokens returned
     * will be parsed via `this.parseTokensFromRedirect`.
     */
    /* eslint-enable max-len */
    public login() {
        if (this._settings.restorePathAfterLogin) {
            this.storePathBeforeLogin();
        }
        const additionalLoginQueryParams = this.getQueryStringForLogin();
        window.location.href = this._authManager.generateAuthUrl(additionalLoginQueryParams).href;
    }

    /**
     * Clear any tokens saved to sessionStorage. Note that session cookies are not cleared.
     */
    public logout(url?: any | string) {
        this._tokenManager.clear();
        window.location.href = this._authManager.generateLogoutUrl(
            url || this._settings.redirectUri || window.location.href
        ).href;
    }

    /**
     * Get the tenant from the url params for login.
     */
    public getTenantQueryForLogin(): string | undefined {
        if (this._settings.tenant) {
            return undefined;
        }
        const urlQueryParams = new URLSearchParams(window.location.search);
        return urlQueryParams.get('tenant')?.toString();
    }

    /**
     * The default function to restore path if config.onRestorePath is not specified.
     */
    private static defaultRestorePath(path: string): void {
        window.history.replaceState(null, '', path);
    }

    /**
     * Check for token returned from a previous redirect, if none then call the /authorize
     */
    private requestToken = memoize((): Promise<AccessToken> => this._authManager.getAccessToken());

    /**
     * Store the complete window.location information so that the state can be restored after the
     * browser is redirected to the login page and then back here.
     */
    private storePathBeforeLogin(): void {
        try {
            const path = window.location.pathname + window.location.search + window.location.hash;
            this._authManager.setRedirectPath(path);
        } catch {
            Logger.warn(`Cannot store the path at ${REDIRECT_PATH_PARAMS_NAME}`);
        }
    }

    /**
     * Retrieve the information stored in storePathBeforeLogin to restore the state of this page.
     */
    private restorePathAfterLogin(): void {
        try {
            const path = this._authManager.getRedirectPath();
            this._authManager.deleteRedirectPath();
            if (path && this._settings.onRestorePath) {
                this._settings.onRestorePath(path);
            }
        } catch {
            Logger.warn(`Cannot restore the path from ${REDIRECT_PATH_PARAMS_NAME}`);
        }
    }

    /**
     * Get the query string information for the params specified in queryParamsForLogin.
     * This is used to pass additional information via query params to the log in page.
     */
    private getQueryStringForLogin(): Map<string, string> {
        if (!this._settings.queryParamsForLogin) {
            return new Map();
        }

        const urlQueryParams = new URLSearchParams(window.location.search);
        return new Map(
            Object.entries(this._settings.queryParamsForLogin)
                .filter(([key]) => urlQueryParams.has(key))
                .map(([key, value]) => [key, String(value)])
        );
    }
}
