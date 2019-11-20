/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

import { storageBuilder, browserHasSessionStorage, warn, getCookieStorage } from './util';

class StorageManager {
    constructor(name) {
        if (!browserHasSessionStorage()) {
            warn("This browser doesn't support sessionStorage. Switching to cookie-based storage.");
            this.storage = storageBuilder(getCookieStorage(), name);
        } else {
            this.storage = storageBuilder(sessionStorage, name);
        }
    }

    add = (key, value) => {
        const storage = this.storage.getStorage();
        storage[key] = value;
        this.storage.setStorage(storage);
    };

    get = key => {
        const storage = this.storage.getStorage();
        return storage[key];
    };

    remove = key => {
        const storage = this.storage.getStorage();
        delete storage[key];
        this.storage.setStorage(storage);
    };

    clear = () => {
        this.storage.clearStorage();
    };

    delete = () => {
        this.storage.removeStorage();
    };
}

export default StorageManager;
