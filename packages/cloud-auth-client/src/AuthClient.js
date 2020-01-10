/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

import get from 'lodash/get';
import has from 'lodash/has';
import memoize from 'lodash/memoize';
import urlParse from 'url-parse';

import defaultConfig from './auth.defaults';
import config from './lib/config';
import AuthClientError from './lib/errors/AuthClientError';
import StorageManager from './lib/storage';
import token from './lib/token';
import TokenManager from './lib/TokenManager';
import { warn } from './lib/util';

class AuthClient {
    constructor(args) {
        if (!args.clientId) {
            throw new AuthClientError('missing required configuration option `clientId`');
        }

        this.options = {
            onRestorePath: this.restorePath,
            ...defaultConfig,
            ...args,
        };

        this.tokenManager = new TokenManager(this);
        this.storage = new StorageManager(config.REDIRECT_PARAMS_STORAGE_NAME);

        if (!this.isAuthenticated()) {
            if (this.options.autoRedirectToLogin) {
                this.getToken();
            }
        }
    }

    getToken() {
        const autoRedirect = () => {
            if (this.options.autoRedirectToLogin) {
                this.redirectToLogin();
            }
        };

        this.requestTokens()
            .then(tokens => {
                if (tokens) {
                    this.applyTokens(tokens);
                } else {
                    autoRedirect();
                }
            })
            .catch(e => {
                if (this.loginOrConsentRequired(e)) {
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
    parseTokensFromRedirect = () =>
        token
            .parseFromUrl(this)
            .then(tokens => {
                if (this.options.restorePathAfterLogin) {
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

    /**
     * Add any tokens found to the tokenManager which stores them in sessionStorage.
     */
    applyTokens = tokens => {
        if (tokens === null) {
            return;
        }
        tokens.forEach(item => {
            if (has(item, 'accessToken')) {
                this.tokenManager.add('accessToken', item);
            }
        });
    };

    getAccessToken = () => {
        this.checkExpiration('accessToken');
        return get(this.tokenManager.get('accessToken'), 'accessToken');
    };

    isAuthenticated = () => !!this.getAccessToken();

    checkExpiration = tokenType => {
        const now = Math.floor(new Date().getTime() / 1000);
        const expire = get(this.tokenManager.get(tokenType), 'expiresAt');
        const expirationBuffer = this.options.maxClockSkew || config.MAX_CLOCK_SKEW;
        if (now - expirationBuffer > expire) {
            warn('The JWT expired and is no longer valid');
            this.tokenManager.clear();
            this.redirectToLogin();
        }
    };

    /**
     * Store the complete window.location information so that the state can be restored after the
     * browser is redirected to the login page and then back here.
     */
    storePathBeforeLogin = () => {
        try {
            const path = window.location.pathname + window.location.search + window.location.hash;
            this.storage.add(config.REDIRECT_PATH_PARAMS_NAME, path);
        } catch (e) {
            warn(`Cannot store the path at  ${config.REDIRECT_PATH_PARAMS_NAME}`);
        }
    };

    /**
     * Get the query string information for the params specified in queryParamsForLogin.
     * This is used to pass additional information via query params to the log in page.
     */
    getQueryStringForLogin = () => {
        if (this.options.queryParamsForLogin) {
            const urlQueryParams = new URLSearchParams(window.location.search);
            const paramsFoundInUrl = Object.keys(this.options.queryParamsForLogin).filter(param =>
                urlQueryParams.has(param)
            );
            const queryParams = paramsFoundInUrl.map(
                param => `${param}=${urlQueryParams.get(param)}`
            );
            return queryParams.join('&');
        }
        return '';
    };

    /**
     * Retrieve the information stored in storePathBeforeLogin to restore the state of this page.
     */
    restorePathAfterLogin = () => {
        try {
            const p = this.storage.get(config.REDIRECT_PATH_PARAMS_NAME);
            this.storage.remove(config.REDIRECT_PATH_PARAMS_NAME);
            if (p) {
                this.options.onRestorePath(p);
            }
        } catch (e) {
            warn(`Cannot restore the path from ${config.REDIRECT_PATH_PARAMS_NAME}`);
        }
    };

    /**
     * The default function to restore path if config.onRestorePath is not specified.
     */
    restorePath = p => {
        window.history.replaceState(null, null, p);
    };

    /**
     * Store window.location path information and initiate the Implicit Flow.
     * (see: https://developer.okta.com/authentication-guide/implementing-authentication/implicit#2-using-the-implicit-flow)
     *
     * If the user does not have an existing session, this will redirect to login Page. If they
     * have an existing session, or after they log in, they will be redirected back to the
     * `config.redirectUri` (or `window.location.href` if not specified) and any tokens returned
     * will be parsed via `this.parseTokensFromRedirect`.
     */
    redirectToLogin = () => {
        if (this.options.restorePathAfterLogin) {
            this.storePathBeforeLogin();
        }

        let options = null;
        if (this.options.queryParamsForLogin) {
            options = { additionalQueryString: this.getQueryStringForLogin() };
        }

        token.getWithRedirect(this, options);
    };

    /**
     * Check if we already have an access token in the tokenManager (sessionStorage).
     * If not, check if there is one returned from a redirect (e.g. in the query string).
     * If that fails due to consent or login being required then redirect to the login page.
     */
    checkAuthentication = ({ redirect = this.options.autoRedirectToLogin } = {}) =>
        new Promise((resolve, reject) => {
            if (this.isAuthenticated()) {
                resolve(true);
                return;
            }
            this.requestTokens().then(
                tokens => {
                    if (tokens != null) {
                        this.applyTokens(tokens);
                        resolve(true);
                        return;
                    }
                    if (redirect) {
                        reject(AuthClientError('token not found'));
                        return;
                    }
                    resolve(false);
                },
                e => {
                    if (this.loginOrConsentRequired(e) && redirect) {
                        this.redirectToLogin();
                        // Change the error.message to indicate that a redirect is being performed
                        e.message = 'Redirecting to the login page...';
                    }
                    reject(e);
                }
            );
        });

    /**
     * Determine if the error indicates an OAuth error where consent or login are required.
     */
    loginOrConsentRequired = e =>
        e.errorCode === 'login_required' || e.errorCode === 'consent_required';

    /**
     * Return information contained in the JWT id_token.
     */
    getUserInfo = () => token.decode(this.getIdToken());

    /**
     * Clear any tokens saved to sessionStorage. Note that session cookies are not cleared.
     */
    logout = url => {
        const logoutRedirUrl =
            typeof url === 'string' ? url : this.options.redirectUri || window.location.href;
        const authUrl = urlParse(this.options.authorizeUrl).origin;
        this.tokenManager.clear();
        window.location = `${authUrl}/logout?redirect_uri=${encodeURIComponent(logoutRedirUrl)}`;
    };
}

export default AuthClient;
