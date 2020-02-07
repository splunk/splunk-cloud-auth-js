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

import { SplunkAuthClientError } from '../error/splunk-auth-client-error';
import { StorageFactory } from './storage-factory';

/**
 * StorageManager.
 */
export class StorageManager {
    /**
     * StorageManager.
     * @param storageName Key name of the data blob in Storage.
     * @param storageFactory StorageFactory.
     */
    public constructor(storageName: string) {
        this._storageName = storageName;
        this._storage = StorageFactory.get();
    }

    private _storage: Storage;

    private _storageName: string;

    /**
     * Gets the storage name.
     */
    public get storageName(): string {
        return this._storageName;
    }

    /**
     * Gets data by key reference in the data blob from Storage.
     * When the key reference is not specified, the entire data blob will be returned from Storage.
     * @param key Key reference.
     */
    public get(key?: string): any {
        const storageString = this._storage.getItem(this.storageName);
        if (!storageString) {
            return undefined;
        }

        let storageBlob;
        try {
            storageBlob = JSON.parse(storageString);
        } catch (e) {
            throw new SplunkAuthClientError(`Unable to parse storage string: ${this.storageName}`);
        }

        if (key) {
            return storageBlob[key];
        }

        return storageBlob;
    }

    /**
     * Sets a data blob into Storage by key reference.
     * When the key reference is not specified, the entire data blob will be set in Storage.
     * @param data Data.
     * @param key Key reference.
     */
    public set(data: any, key?: string): void {

        let dataBlob;
        if (key) {
            dataBlob = this.get();
            if (dataBlob === undefined) {
                dataBlob = {};
            }
            dataBlob[key] = data;
        } else {
            dataBlob = data;
        }

        try {
            const dataJsonString = JSON.stringify(dataBlob);
            this._storage.setItem(this.storageName, dataJsonString);
        } catch (e) {
            throw new SplunkAuthClientError(`Unable to set storage: ${this.storageName}`);
        }
    }

    /**
     * Removes an entry in the data blob in Storage by key reference.
     * When the key reference is not specified, the entire data blob in Storage is deleted.
     * @param key Key reference.
     */
    public delete(key?: string): void {
        if (key) {
            const dataBlob = this.get();
            if (dataBlob) {
                delete dataBlob[key];
                this.set(dataBlob);
            }
        } else {
            try {
                this._storage.removeItem(this.storageName);
            } catch (e) {
                throw new SplunkAuthClientError(`Unable to remove storage: ${this.storageName}`);
            }
        }
    }

    /**
     * Clears an entry in the data blob in Storage by key reference.
     * When the key reference is not specified, the entire data blob in Storage is cleared.
     * @param key Key reference.
     */
    public clear(key?: string): void {
        if (key) {
            const data = this.get();
            data[key] = {};
            this.set(data);
        } else {
            this.set({});
        }
    }
}
