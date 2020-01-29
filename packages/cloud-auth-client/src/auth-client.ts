/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

import get from 'lodash/get';
import has from 'lodash/has';
import memoize from 'lodash/memoize';
import urlParse from 'url-parse';

import { AuthClientSettings, REDIRECT_PARAMS_STORAGE_NAME, REDIRECT_PATH_PARAMS_NAME } from './auth-client-settings';
import { AuthClientError } from './errors/auth-client-error';
import { StorageManager } from './storage/storage-manager';
import token from './token';
import { TokenManager, TokenManagerSettings } from './token-manager';
import { warn } from './util';

/**
 * AuthClient.
 */
export class AuthClient {
    /**
     * AuthClient constructor.
     * @param settings AuthClientSettings.
     */
    public constructor(settings: AuthClientSettings) {
        if (!settings.clientId) {
            throw new AuthClientError('missing required configuration option `clientId`');
        }

        this._options = settings;
        this._options.onRestorePath = this._options.onRestorePath ? this._options.onRestorePath : this.restorePath;
        this._tokenManager =
            new TokenManager(
                new TokenManagerSettings(
                    this._options.clientId,
                    this._options.redirectUri,
                    this._options.authorizeUrl,
                    this._options.autoTokenRenewalBuffer
                )
            );
        this._storage = new StorageManager(REDIRECT_PARAMS_STORAGE_NAME);

        if (!this.isAuthenticated()) {
            if (this._options.autoRedirectToLogin) {
                this.getToken();
            }
        }
    }

    private _options: AuthClientSettings;

    private _storage: StorageManager;

    private _tokenManager: TokenManager;

    /**
     * AuthClientSettings.
     */
    public get options(): AuthClientSettings {
        return this._options;
    }

    /**
     * StorageManager.
     */
    public get storage(): StorageManager {
        return this._storage;
    }

    /**
     * TokenManager.
     */
    public get tokenManager(): TokenManager {
        return this._tokenManager;
    }

    /**
     * Gets Token.
     */
    public getToken() {
        const autoRedirect = () => {
            if (this._options.autoRedirectToLogin) {
                this.redirectToLogin();
            }
        };

        this.requestTokens()
            .then((tokens: any) => {
                if (tokens) {
                    this.applyTokens(tokens);
                } else {
                    autoRedirect();
                }
            })
            .catch((e: any) => {
                if (AuthClient.loginOrConsentRequired(e)) {
                    autoRedirect();
                }
            });
    }

    /**
     * Check for tokens returned from a previous redirect, if none then call the /authorize
     */
    requestTokens = memoize(() => this.parseTokensFromRedirect());

    /**
     * Attempt to read the token(s) returned from a redirect.
     *
     * For successful authentication requests `access_token`, `id_token`, and `code` are read from
     * the url itself.
     *
     * For authentication errors (e.g. login or consent are required), the `error` and
     * `error_description` are read from the url and used to populate and throw an OAuthError.
     *
     * For cases where no token is present, failure to verify claims, or state mismatches an
     * AuthClientError is thrown.
     */
    public parseTokensFromRedirect(): any {
        return token
            .parseFromUrl()
            .then((tokens: any) => {
                if (this._options.restorePathAfterLogin) {
                    this.restorePathAfterLogin();
                }
                return tokens;
            })
            .catch(e => {
                if (e.message === 'Unable to parse a token from the url') {
                    // If there is no token nor any error messages in the url string (e.g. the page was
                    // visited for the first time) then simply return null
                    return null;
                }
                // For OAuth errors, failure to validate claims, etc. re-throw
                throw e;
            });
    }

    /**
     * Add any tokens found to the tokenManager which stores them in sessionStorage.
     */
    public applyTokens(tokens: any) {
        if (tokens === null) {
            return;
        }
        tokens.forEach((item: any) => {
            if (has(item, 'accessToken')) {
                this._tokenManager.add('accessToken', item);
            }
        });
    }

    public getAccessToken() {
        this.checkExpiration('accessToken');
        return get(this._tokenManager.get('accessToken'), 'accessToken');
    }

    public isAuthenticated() {
        return !!this.getAccessToken();
    }

    public checkExpiration(tokenType: any) {
        const now = Math.floor(new Date().getTime() / 1000);
        const expire = get(this._tokenManager.get(tokenType), 'expiresAt');
        const expirationBuffer = this._options.maxClockSkew;
        if (now - expirationBuffer > expire) {
            warn('The JWT expired and is no longer valid');
            this._tokenManager.clear();
            this.redirectToLogin();
        }
    }

    /**
     * Store the complete window.location information so that the state can be restored after the
     * browser is redirected to the login page and then back here.
     */
    public storePathBeforeLogin(): void {
        try {
            const path = window.location.pathname + window.location.search + window.location.hash;
            this._storage.set(path, REDIRECT_PATH_PARAMS_NAME);
        } catch (e) {
            warn(`Cannot store the path at  ${REDIRECT_PATH_PARAMS_NAME}`);
        }
    }

    /**
     * Get the query string information for the params specified in queryParamsForLogin.
     * This is used to pass additional information via query params to the log in page.
     */
    public getQueryStringForLogin(): string {
        if (this._options.queryParamsForLogin) {
            const urlQueryParams = new URLSearchParams(window.location.search);
            const paramsFoundInUrl = Object.keys(this._options.queryParamsForLogin).filter(param =>
                urlQueryParams.has(param)
            );
            const queryParams = paramsFoundInUrl.map(
                param => `${param}=${urlQueryParams.get(param)}`
            );
            return queryParams.join('&');
        }
        return '';
    }

    /**
     * Retrieve the information stored in storePathBeforeLogin to restore the state of this page.
     */
    restorePathAfterLogin = () => {
        try {
            const p = this._storage.get(REDIRECT_PATH_PARAMS_NAME);
            this._storage.clear(REDIRECT_PATH_PARAMS_NAME);
            if (p && this._options.onRestorePath) {
                this._options.onRestorePath(p);
            }
        } catch (e) {
            warn(`Cannot restore the path from ${REDIRECT_PATH_PARAMS_NAME}`);
        }
    };

    /**
     * The default function to restore path if config.onRestorePath is not specified.
     */
    // eslint-disable-next-line class-methods-use-this
    public restorePath(path: string): void {
        window.history.replaceState(null, '', path);
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
    redirectToLogin = () => {
        if (this._options.restorePathAfterLogin) {
            this.storePathBeforeLogin();
        }

        let options = null;
        if (this._options.queryParamsForLogin) {
            options = { additionalQueryString: this.getQueryStringForLogin() };
        }

        token.getWithRedirect(this._options.clientId, this._options.redirectUri, this._options.authorizeUrl, options);
    };

    /**
     * Check if we already have an access token in the tokenManager (sessionStorage).
     * If not, check if there is one returned from a redirect (e.g. in the query string).
     * If that fails due to consent or login being required then redirect to the login page.
     */
    checkAuthentication = (redirect?: boolean) => {
        const shouldRedirect = redirect === undefined ? this._options.autoRedirectToLogin : redirect;

        return new Promise((resolve, reject) => {
            if (this.isAuthenticated()) {
                resolve(true);
                return;
            }
            this.requestTokens().then(
                (tokens: any) => {
                    if (tokens != null) {
                        this.applyTokens(tokens);
                        resolve(true);
                        return;
                    }
                    if (shouldRedirect) {
                        reject(new AuthClientError('token not found'));
                        return;
                    }
                    resolve(false);
                },
                (e: any) => {
                    if (AuthClient.loginOrConsentRequired(e) && shouldRedirect) {
                        this.redirectToLogin();
                        // Change the error.message to indicate that a redirect is being performed
                        e.message = 'Redirecting to the login page...';
                    }
                    reject(e);
                }
            );
        });
    };

    /**
     * Determine if the error indicates an OAuth error where consent or login are required.
     */
    private static loginOrConsentRequired(e: any) {
        return e.code === 'login_required' || e.code === 'consent_required';
    }

    /**
     * Clear any tokens saved to sessionStorage. Note that session cookies are not cleared.
     */
    logout = (url?: any | string) => {
        const logoutRedirUrl =
            typeof url === 'string' ? url : this._options.redirectUri || window.location.href;
        const authUrl = urlParse(this._options.authorizeUrl).origin;
        this._tokenManager.clear();
        window.location.href = `${authUrl}/logout?redirect_uri=${encodeURIComponent(logoutRedirUrl)}`;
    };
}
