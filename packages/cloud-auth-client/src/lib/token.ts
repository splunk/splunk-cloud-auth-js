/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/
/* eslint-env node */
/* eslint-disable dot-notation, @typescript-eslint/camelcase */

import Q from 'q';

import config from './config';
import AuthClientError from './errors/AuthClientError';
import OAuthError from './errors/OAuthError';
import StorageManager from './storage';
import * as util from './util';

const storage = new StorageManager(config.REDIRECT_PARAMS_STORAGE_NAME);

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

function handleOAuthResponse(client, oauthParams, res, urls) {
    const tokenTypes = oauthParams.responseType;
    const scopes = util.clone(oauthParams.scopes);

    return new Q()
        .then(() => {
            if (res['error'] || res['error_description']) {
                throw new OAuthError(res['error'], res['error_description'] || 'OAuth error');
            }

            if (res.state !== oauthParams.state) {
                throw new AuthClientError("OAuth flow response state doesn't match request state");
            }

            const tokenDict = {};

            if (res['access_token']) {
                tokenDict['token'] = {
                    accessToken: res['access_token'],
                    expiresAt: Number(res['expires_in']) + Math.floor(Date.now() / 1000),
                    expiresIn: res['expires_in'],
                    tokenType: res['token_type'],
                    scopes,
                    authorizeUrl: urls.authorizeUrl,
                };
            }

            if (res['code']) {
                tokenDict['code'] = {
                    authorizationCode: res['code'],
                };
            }

            return tokenDict;
        })
        .then(tokenDict => {
            if (!Array.isArray(tokenTypes)) {
                return tokenDict[tokenTypes];
            }

            if (!tokenDict['token']) {
                throw new AuthClientError('Unable to parse OAuth flow response');
            }

            // Create token array in the order of the responseType array
            return tokenTypes.map(item => tokenDict[item]);
        });
}

function hashOAuthSuccessParams(rawHash) {
    const hash = rawHash.toLowerCase();
    return hash.indexOf('access_token=') > -1;
}

function hasOAuthErrorParams(rawHash) {
    const hash = rawHash.toLowerCase();
    return hash.indexOf('error=') > -1 || hash.indexOf('error_description=') > -1;
}

function hasOAuthParams(rawHash) {
    return hashOAuthSuccessParams(rawHash) || hasOAuthErrorParams(rawHash);
}

function parseFromUrl(client, url) {
    const nativeLoc = window.location;
    let hash = nativeLoc.hash;
    if (url) {
        hash = url.substring(url.indexOf('#'));
    }
    if (!hash || !hasOAuthParams(hash)) {
        return Q.reject(new AuthClientError('Unable to parse a token from the url'));
    }

    const oauthParamsContent = storage.get(config.REDIRECT_OAUTH_PARAMS_NAME);
    if (!oauthParamsContent) {
        return Q.reject(new AuthClientError('Unable to retrieve OAuth redirect params storage'));
    }

    let oauthParams;
    let urls;

    try {
        oauthParams = JSON.parse(oauthParamsContent);
        urls = oauthParams.urls;
        delete oauthParams.urls;
        storage.remove(config.REDIRECT_OAUTH_PARAMS_NAME);
    } catch (e) {
        return Q.reject(
            new AuthClientError(
                `Unable to parse the ${config.REDIRECT_OAUTH_PARAMS_NAME} param: ${e.message}`
            )
        );
    }

    return Q.resolve(util.hashToObject(hash)).then(res => {
        if (!url) {
            // Remove the hash from the url
            removeHash();
        }
        return handleOAuthResponse(client, oauthParams, res, urls);
    });
}

function convertOAuthParamsToQueryParams(oauthParams) {
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

function buildAuthorizeParams(oauthParams) {
    const oauthQueryParams = convertOAuthParamsToQueryParams(oauthParams);
    return util.toQueryParams(oauthQueryParams);
}

function getDefaultOAuthParams(client, options) {
    let defaults = {
        clientId: client.options.clientId,
        redirectUri: client.options.redirectUri || window.location.href,
        responseType: ['token', 'id_token'],
        state: util.genRandomString(64),
        nonce: util.genRandomString(64),
        scopes: ['openid', 'email', 'profile'],
    };

    defaults = { ...defaults, ...options };
    return defaults;
}

function getAuthUrl(client, options) {
    const oauthParams = getDefaultOAuthParams(client, options);
    const urls = util.getOAuthUrls(client, options);

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
    storage.add(
        config.REDIRECT_OAUTH_PARAMS_NAME,
        JSON.stringify({
            responseType: oauthParams.responseType,
            state: oauthParams.state,
            nonce: oauthParams.nonce,
            scopes: oauthParams.scopes,
            clientId: oauthParams.clientId,
            urls,
        })
    );

    return requestUrl;
}

function getWithRedirect(client, options) {
    window.location = getAuthUrl(client, options);
}

const token = {
    getWithRedirect,
    parseFromUrl,
    getAuthUrl,
};

export default token;
