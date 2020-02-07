/**
 * Copyright 2019 Splunk, Inc.
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

import { CookieStorage } from 'cookie-storage';
import { CookieOptions } from 'cookie-storage/lib/cookie-options';

import { Logger } from '../common/logger';

const DUMMY_STORAGE_KEY = 'splunk-test-storage';

/**
 * DefaultCookieOptions.
 */
class DefaultCookieOptions implements CookieOptions {
    /**
     * Path for cookie.
     */
    public path = '/';

    /**
     * Cookie expiry.
     *
     * Note that this value is defaulted to the maximum date time range as defined by
     * http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.1.
     *
     * The intent is for the cookie to not expire.
     */
    public expires: Date = new Date(8640000000000000);
}

/**
 * StorageFactory.
 */
export class StorageFactory {
    /**
     * Returns a Web Storage API compliant storage mechanism.
     * Preference is to prefer sessionStorage. However it is possible that on some browsers sessionStorage
     * is not available or has reached full capacity. In these situations, the fallback is to use cookies.
     */
    public static get(): Storage {
        if (window.sessionStorage && StorageFactory.checkStorage(window.sessionStorage)) {
            return window.sessionStorage;
        }

        Logger.warn("This browser doesn't support sessionStorage. Switching to cookie-based storage.");
        return new CookieStorage(new DefaultCookieOptions());
    }

    /**
     * Checks whether setting and removing of an item from storage is successful.
     * @param storage Storage.
     */
    private static checkStorage(storage: Storage) {
        try {
            storage.setItem(DUMMY_STORAGE_KEY, DUMMY_STORAGE_KEY);
            storage.removeItem(DUMMY_STORAGE_KEY);
            return true;
        } catch (e) {
            return false;
        }
    }
}
