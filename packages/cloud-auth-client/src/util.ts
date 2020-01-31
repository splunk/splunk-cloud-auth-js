/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/
/* eslint-env node */
/* eslint-disable prefer-rest-params */
import { AuthClientError } from './errors/auth-client-error';

export function clone(obj: any) {
    if (obj) {
        const str = JSON.stringify(obj);
        if (str) {
            return JSON.parse(str);
        }
    }
    return obj;
}

export function removeNils(obj: any) {
    const cleaned: any = {};
    Object.keys(obj).forEach(prop => {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            const value = obj[prop];
            if (value !== null && value !== undefined) {
                cleaned[prop] = value;
            }
        }
    });
    return cleaned;
}

export function isString(obj: any) {
    return Object.prototype.toString.call(obj) === '[object String]';
}

export function isObject(obj: any) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}

export function genRandomString(length: number) {
    const randomCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklnopqrstuvwxyz0123456789';
    let random = '';
    for (let c = 0, cl = randomCharset.length; c < length; c += 1) {
        random += randomCharset[Math.floor(Math.random() * cl)];
    }
    return random;
}

export function base64UrlToBase64(b64u: string) {
    return b64u.replace(/-/g, '+').replace(/_/g, '/');
}

export function base64UrlToString(b64u: string) {
    let b64 = base64UrlToBase64(b64u);
    switch (b64.length % 4) {
        case 0:
            break;
        case 2:
            b64 += '==';
            break;
        case 3:
            b64 += '=';
            break;
        default:
            throw new AuthClientError('Not a valid Base64Url');
    }
    const utf8 = atob(b64);
    try {
        return decodeURIComponent(escape(utf8));
    } catch (e) {
        return utf8;
    }
}

export function toQueryParams(obj: any) {
    const queryString: string[] = [];
    if (obj !== null) {
        Object.keys(obj).forEach(key => {
            if (
                Object.prototype.hasOwnProperty.call(obj, key) &&
                obj[key] !== undefined &&
                obj[key] !== null
            ) {
                queryString.push(`${key}=${encodeURIComponent(obj[key])}`);
            }
        });
    }
    if (queryString.length) {
        return `?${queryString.join('&')}`;
    }
    return '';
}

export function removeTrailingSlash(path: string) {
    if (!path) {
        return '';
    }
    // Remove any whitespace before or after string
    const trimmed = path.replace(/^\s+|\s+$/gm, '');
    if (trimmed.slice(-1) === '/') {
        return trimmed.slice(0, -1);
    }
    return trimmed;
}

export function warn(text: string) {
    const nativeConsole = typeof window !== 'undefined' && window.console;
    if (nativeConsole && nativeConsole.log) {
        nativeConsole.log(`[splunk-cloud-auth] WARN: ${text}`);
    }
}

export function getBaseDomain(url: string) {
    const hostname = new URL(url).hostname;
    return hostname.slice(hostname.indexOf('.') + 1);
}

// OauthUtil
export function isValidTokenObject(token: any) {
    if (!isObject(token) || (!token.expiresAt && token.expiresAt !== 0) || !token.accessToken) {
        return false;
    }
    return true;
}

export function hashToObject(hash: string) {
    // Predefine regexs for parsing hash
    const plus2space = /\+/g;
    const paramSplit = /([^&=]+)=?([^&]*)/g;

    // Remove the leading hash
    const fragment = hash.substring(1);

    const obj: any = {};

    // Loop until we have no more params
    let param;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        param = paramSplit.exec(fragment);
        if (!param) {
            break;
        }

        const key = param[1];
        const value = param[2];

        // id_token should remain base64url encoded
        if (key === 'id_token' || key === 'access_token' || key === 'code') {
            obj[key] = value;
        } else {
            obj[key] = decodeURIComponent(value.replace(plus2space, ' '));
        }
    }
    return obj;
}

export function getOAuthUrls(authorizeUrl: string, optionsIn: any) {
    const options = optionsIn || {};

    // Get user-supplied arguments
    const sanitizedAurhorizeUrl = removeTrailingSlash(options.authorizeUrl) || authorizeUrl;

    return {
        authorizeUrl: sanitizedAurhorizeUrl,
    };
}
