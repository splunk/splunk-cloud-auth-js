/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/
/* eslint-env node */

import Cookies from 'js-cookie';

const cookieOptions: any = {
    path: '/'
};
const cookies = {
    set(name: string, value: any, expiresAt?: string) {
        if (expiresAt && Date.parse(expiresAt)) {
            // Expires value can be converted to a Date object.
            //
            // If the 'expiresAt' value is not provided, or the value cannot be
            // parsed as a Date object, the cookie will set as a session cookie.
            cookieOptions.expires = new Date(expiresAt);
        }

        Cookies.set(name, value, cookieOptions);
        return cookies.get(name);
    },

    get(name: string) {
        return Cookies.get(name);
    },

    delete(name: string) {
        return Cookies.remove(name, cookieOptions);
    },
};

export { cookies };
