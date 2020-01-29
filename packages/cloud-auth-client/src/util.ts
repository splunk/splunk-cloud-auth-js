/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/
/* eslint-env node */
/* eslint-disable prefer-rest-params */
import { cookies } from './cookies';
import { AuthClientError } from './errors/auth-client-error';

export function clone(obj) {
    if (obj) {
        const str = JSON.stringify(obj);
        if (str) {
            return JSON.parse(str);
        }
    }
    return obj;
}

export function removeNils(obj) {
    const cleaned = {};
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

export function isString(obj) {
    return Object.prototype.toString.call(obj) === '[object String]';
}

export function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}

export function genRandomString(length) {
    const randomCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklnopqrstuvwxyz0123456789';
    let random = '';
    for (let c = 0, cl = randomCharset.length; c < length; c += 1) {
        random += randomCharset[Math.floor(Math.random() * cl)];
    }
    return random;
}

export function base64UrlToBase64(b64u) {
    return b64u.replace(/-/g, '+').replace(/_/g, '/');
}

export function base64UrlToString(b64u) {
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

export function toQueryParams(obj) {
    const str = [];
    if (obj !== null) {
        Object.keys(obj).forEach(key => {
            if (
                Object.prototype.hasOwnProperty.call(obj, key) &&
                obj[key] !== undefined &&
                obj[key] !== null
            ) {
                str.push(`${key}=${encodeURIComponent(obj[key])}`);
            }
        });
    }
    if (str.length) {
        return `?${str.join('&')}`;
    }
    return '';
}

export function removeTrailingSlash(path) {
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

export function warn(text) {
    const nativeConsole = typeof window !== 'undefined' && window.console;
    if (nativeConsole && nativeConsole.log) {
        nativeConsole.log(`[splunk-cloud-auth] WARN: ${text}`);
    }
}

export function getBaseDomain(url) {
    const hostname = new URL(url).hostname;
    return hostname.slice(hostname.indexOf('.') + 1);
}

// OauthUtil
export function isValidTokenObject(token) {
    if (!isObject(token) || (!token.expiresAt && token.expiresAt !== 0) || !token.accessToken) {
        return false;
    }
    return true;
}

export function hashToObject(hash) {
    // Predefine regexs for parsing hash
    const plus2space = /\+/g;
    const paramSplit = /([^&=]+)=?([^&]*)/g;

    // Remove the leading hash
    const fragment = hash.substring(1);

    const obj = {};

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

// storage util
export function checkStorage(storage) {
    const key = 'splunk-test-storage';
    try {
        storage.setItem(key, key);
        storage.removeItem(key);
        return true;
    } catch (e) {
        return false;
    }
}

export function browserHasSessionStorage() {
    try {
        return window.sessionStorage && checkStorage(sessionStorage);
    } catch (e) {
        return false;
    }
}

export function getCookieStorage() {
    return {
        getItem: cookies.get,
        setItem: (key, value) => {
            // Cookie shouldn't expire
            cookies.set(key, value, '2050-01-01T00:00:00.000Z');
        },
        removeItem: cookies.delete,
    };
}

export function storageBuilder(webstorage, storageName) {
    function getStorage() {
        let storageString = webstorage.getItem(storageName);
        storageString = storageString || '{}';
        try {
            return JSON.parse(storageString);
        } catch (e) {
            throw new AuthClientError(`Unable to parse storage string: ${storageName}`);
        }
    }

    function setStorage(storage) {
        try {
            const storageString = JSON.stringify(storage);
            webstorage.setItem(storageName, storageString);
        } catch (e) {
            throw new AuthClientError(`Unable to set storage: ${storageName}`);
        }
    }

    function clearStorage(key) {
        if (!key) {
            setStorage({});
        }
        const storage = getStorage();
        delete storage[key];
        setStorage(storage);
    }

    function updateStorage(key, value) {
        const storage = getStorage();
        storage[key] = value;
        setStorage(storage);
    }

    function removeStorage() {
        try {
            webstorage.removeItem(storageName);
        } catch (e) {
            throw new AuthClientError(`Unable to remove storage: ${storageName}`);
        }
    }

    return {
        getStorage,
        setStorage,
        clearStorage,
        updateStorage,
        removeStorage,
    };
}
