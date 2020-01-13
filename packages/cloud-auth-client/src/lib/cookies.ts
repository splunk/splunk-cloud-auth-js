/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/
/* eslint-env node */

import Cookies from 'js-cookie';

const cookieOptions = { path: '/' };
const cookies = {
    set(name, value, expiresAt) {
        // eslint-disable-next-line no-extra-boolean-cast
        if (!!Date.parse(expiresAt)) {
            // Expires value can be converted to a Date object.
            //
            // If the 'expiresAt' value is not provided, or the value cannot be
            // parsed as a Date object, the cookie will set as a session cookie.
            cookieOptions.expires = new Date(expiresAt);
        }

        Cookies.set(name, value, cookieOptions);
        return cookies.get(name);
    },

    get(name) {
        return Cookies.get(name);
    },

    delete(name) {
        return Cookies.remove(name, cookieOptions);
    },
};

export { cookies };
