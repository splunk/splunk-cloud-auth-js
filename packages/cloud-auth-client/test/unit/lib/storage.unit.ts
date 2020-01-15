import { assert, expect } from 'chai';

import { cookies } from '../../../src/lib/cookies';
import StorageManager from '../../../src/lib/storage';
import { storageBuilder } from '../../../src/lib/util';

describe('Browser storage', () => {
    describe('storage builder', () => {
        let storage;
        const testData = {
            id: '123',
            name: 'abc',
        };

        it('should create the sessionStorage', () => {
            storage = storageBuilder(sessionStorage, 'test-session-storage');
            storage.setStorage({});
            expect(sessionStorage.getItem('test-session-storage')).to.equal('{}');
        });

        it('should be able to set, get and update the value', () => {
            // set the value
            storage.setStorage(testData);
            let data = storage.getStorage();
            expect(data.id).to.equal(testData.id);
            expect(data.name).to.equal(testData.name);

            // update the value
            const newData = {
                id: 456,
            };
            storage.updateStorage('id', newData.id);
            data = storage.getStorage();
            expect(data.id).to.equal(456);
            expect(data.name).to.equal('abc');
        });

        it('should be able to clear the value and remove the storage', () => {
            storage.setStorage(testData);

            // clear a key from the storage
            storage.clearStorage('id');
            let data = storage.getStorage();
            assert.equal(Object.prototype.hasOwnProperty.call(data, 'id'), false);
            expect(data.name).to.equal(testData.name);

            // remove the storage
            storage.removeStorage();
            data = storage.getStorage();
            expect(data).to.deep.equal({});
            expect(sessionStorage.getItem('test-session-storage')).to.equal(null);
        });
    });

    describe('cookies', () => {
        it('should be able to set, get and update the value', () => {
            cookies.set('testData', 'abc');
            expect(cookies.get('testData')).to.equal('abc');

            // update the value
            cookies.set('testData', 'xyz');
            expect(cookies.get('testData')).to.equal('xyz');
        });

        it('should be able to delete the cookie', () => {
            cookies.set('testData', 'xyz');
            expect(cookies.get('testData')).to.equal('xyz');

            // delete the key
            cookies.delete('testData');
            assert.equal(cookies.get('testData'), undefined);
        });
    });

    describe('storageManager', () => {
        const STORAGE_NAME = 'test-storage';
        const storage = new StorageManager(STORAGE_NAME);
        const user = {
            name: 'aaron',
            email: 'aaron@test.com',
        };

        it('should use the sessionStorage by default', () => {
            storage.add('test', 123);
            expect(sessionStorage.getItem(STORAGE_NAME)).to.equal('{"test":123}');
        });

        it('should set the value in the storage', () => {
            storage.add('user', user);
            const data = storage.get('user');
            expect(data.name).to.equal(user.name);
            expect(data.email).to.equal(user.email);
        });

        it('should update the value in the storage', () => {
            const newUser = {
                name: 'beca',
                email: 'beca@test.com',
            };
            storage.add('user', newUser);
            const data = storage.get('user');
            expect(data.name).to.equal(newUser.name);
            expect(data.email).to.equal(newUser.email);
        });

        it('should clean all the values in the storage', () => {
            storage.add('user', user);
            let data = storage.get('user');
            expect(data.name).to.equal(user.name);

            storage.clear();
            data = storage.get('user');
            assert.equal(data, undefined);
            expect(sessionStorage.getItem(STORAGE_NAME)).to.equal('{}');
        });
    });
});
