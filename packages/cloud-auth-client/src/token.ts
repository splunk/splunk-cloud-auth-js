/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/
/* eslint-env node */
/* eslint-disable dot-notation, @typescript-eslint/camelcase */

import Q from 'q';

import { REDIRECT_OAUTH_PARAMS_NAME, REDIRECT_PARAMS_STORAGE_NAME } from './auth-client-settings';
import { AuthClientError } from './errors/auth-client-error';
import { OAuthError } from './errors/oauth-error';
import { StorageManager } from './storage/storage-manager';
import * as util from './util';

const storage = new StorageManager(REDIRECT_PARAMS_STORAGE_NAME);

function removeHash() {
    const nativeHistory = window.history;
    const nativeDoc = window.document;
    const nativeLoc = window.location;
    if (nativeHistory && nativeHistory.replaceState) {
        nativeHistory.replaceState(null, nativeDoc.title, nativeLoc.pathname + nativeLoc.search);
    } else {
        nativeLoc.hash = '';
    }
}

function handleOAuthResponse(oauthParams: any, res: any, urls: any): any {
    const tokenTypes = oauthParams.responseType;
    const scopes = util.clone(oauthParams.scopes);

    return new Q()
        .then(() => {
            if (res.error || res.error_description) {
                throw new OAuthError(res.error_description || 'OAuth error', res.error);
            }

            if (res.state !== oauthParams.state) {
                throw new AuthClientError("OAuth flow response state doesn't match request state");
            }

            const tokenDict = {
                token: {},
                code: {}
            };

            if (res.access_token) {
                tokenDict.token = {
                    accessToken: res.access_token,
                    expiresAt: Number(res.expires_in) + Math.floor(Date.now() / 1000),
                    expiresIn: res.expires_in,
                    tokenType: res.token_type,
                    scopes,
                    authorizeUrl: urls.authorizeUrl,
                };
            }

            if (res.code) {
                tokenDict.code = {
                    authorizationCode: res.code,
                };
            }

            return tokenDict;
        })
        .then((tokenDict: any) => {
            if (!Array.isArray(tokenTypes)) {
                return tokenDict[tokenTypes];
            }

            if (!tokenDict.token) {
                throw new AuthClientError('Unable to parse OAuth flow response');
            }

            // Create token array in the order of the responseType array
            return tokenTypes.map(item => tokenDict[item]);
        });
}

function hashOAuthSuccessParams(rawHash: string) {
    const hash = rawHash.toLowerCase();
    return hash.indexOf('access_token=') > -1;
}

function hasOAuthErrorParams(rawHash: string) {
    const hash = rawHash.toLowerCase();
    return hash.indexOf('error=') > -1 || hash.indexOf('error_description=') > -1;
}

function hasOAuthParams(rawHash: string) {
    return hashOAuthSuccessParams(rawHash) || hasOAuthErrorParams(rawHash);
}

function parseFromUrl(url?: string) {
    const nativeLoc = window.location;
    let hash = nativeLoc.hash;
    if (url !== undefined && url !== null) {
        const s = url.toString();
        hash = s.substring(s.indexOf('#'));
    }
    if (!hash || !hasOAuthParams(hash)) {
        return Q.reject(new AuthClientError('Unable to parse a token from the url'));
    }

    const oauthParamsContent = storage.get(REDIRECT_OAUTH_PARAMS_NAME);
    if (!oauthParamsContent) {
        return Q.reject(new AuthClientError('Unable to retrieve OAuth redirect params storage'));
    }

    let oauthParams: any;
    let urls: any;

    try {
        oauthParams = JSON.parse(oauthParamsContent);
        urls = oauthParams.urls;
        delete oauthParams.urls;
        storage.delete(REDIRECT_OAUTH_PARAMS_NAME);
    } catch (e) {
        return Q.reject(
            new AuthClientError(
                `Unable to parse the ${REDIRECT_OAUTH_PARAMS_NAME} param: ${e.message}`
            )
        );
    }

    return Q.resolve(util.hashToObject(hash)).then(res => {
        if (!url) {
            // Remove the hash from the url
            removeHash();
        }
        return handleOAuthResponse(oauthParams, res, urls);
    });
}

function convertOAuthParamsToQueryParams(oauthParams: any): any {
    // Quick validation
    if (!oauthParams.clientId) {
        throw new AuthClientError(
            'A clientId must be specified in the AuthClient constructor to get a token'
        );
    }

    if (util.isString(oauthParams.responseType) && oauthParams.responseType.indexOf(' ') !== -1) {
        throw new AuthClientError('Multiple OAuth responseTypes must be defined as an array');
    }

    // Convert our params to their actual OAuth equivalents
    const oauthQueryParams = util.removeNils({
        client_id: oauthParams.clientId,
        redirect_uri: oauthParams.redirectUri,
        response_type: oauthParams.responseType,
        state: oauthParams.state,
        nonce: oauthParams.nonce,
        max_age: oauthParams.maxAge,
    });

    if (Array.isArray(oauthQueryParams['response_type'])) {
        oauthQueryParams['response_type'] = oauthQueryParams['response_type'].join(' ');
    }

    if (
        oauthParams.responseType.indexOf('id_token') !== -1 &&
        oauthParams.scopes.indexOf('openid') === -1
    ) {
        throw new AuthClientError(
            'openid scope must be specified in the scopes argument when requesting an id_token'
        );
    } else {
        oauthQueryParams.scope = oauthParams.scopes.join(' ');
    }

    return oauthQueryParams;
}

function buildAuthorizeParams(oauthParams: any) {
    const oauthQueryParams = convertOAuthParamsToQueryParams(oauthParams);
    return util.toQueryParams(oauthQueryParams);
}

function getDefaultOAuthParams(clientId: string, redirectUri: string, options: any) {
    let defaults = {
        clientId,
        redirectUri: redirectUri || window.location.href,
        responseType: ['token', 'id_token'],
        state: util.genRandomString(64),
        nonce: util.genRandomString(64),
        scopes: ['openid', 'email', 'profile'],
    };

    defaults = { ...defaults, ...options };
    return defaults;
}

function getAuthUrl(clientId: string, redirectUri: string, authorizeUrl: string, options?: any) {
    const oauthParams = getDefaultOAuthParams(clientId, redirectUri, options);
    const urls = util.getOAuthUrls(authorizeUrl, options);

    let allQueryParams = '';
    const authorizeQueryParams = buildAuthorizeParams(oauthParams);
    if (authorizeQueryParams) {
        allQueryParams = authorizeQueryParams;
    }
    const additionalQueryString = options && options.additionalQueryString;
    if (additionalQueryString) {
        if (authorizeQueryParams) {
            allQueryParams = `${allQueryParams}&${additionalQueryString}`;
        } else {
            allQueryParams = `?${additionalQueryString}`;
        }
    }
    const requestUrl = `${urls.authorizeUrl}${allQueryParams}`;

    // Set sessionStorage to store the oauthParams
    storage.set(
        JSON.stringify({
            responseType: oauthParams.responseType,
            state: oauthParams.state,
            nonce: oauthParams.nonce,
            scopes: oauthParams.scopes,
            clientId: oauthParams.clientId,
            urls,
        }),
        REDIRECT_OAUTH_PARAMS_NAME
    );

    return requestUrl;
}

function getWithRedirect(clientId: string, redirectUri: string, authorizeUrl: string, options: any) {
    window.location = getAuthUrl(clientId, redirectUri, authorizeUrl, options);
}

const token = {
    getWithRedirect,
    parseFromUrl,
    getAuthUrl,
};

export default token;
