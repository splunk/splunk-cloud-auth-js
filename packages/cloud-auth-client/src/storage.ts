/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

import { browserHasSessionStorage, getCookieStorage, storageBuilder, warn } from './util';

class StorageManager {
    constructor(name: string) {
        if (!browserHasSessionStorage()) {
            warn("This browser doesn't support sessionStorage. Switching to cookie-based storage.");
            this.storage = storageBuilder(getCookieStorage(), name);
        } else {
            this.storage = storageBuilder(sessionStorage, name);
        }
    }

    protected storage: any;

    public add(key: string, value: any) {
        const storage = this.storage.getStorage();
        storage[key] = value;
        this.storage.setStorage(storage);
    }

    public get(key: string) {
        const storage = this.storage.getStorage();
        return storage[key];
    }

    public remove(key: string) {
        const storage = this.storage.getStorage();
        delete storage[key];
        this.storage.setStorage(storage);
    }

    public clear() {
        this.storage.clearStorage();
    }

    public delete() {
        this.storage.removeStorage();
    }
}

export default StorageManager;
