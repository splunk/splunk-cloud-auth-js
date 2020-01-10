/* eslint-env mocha */

import { expect } from 'chai';

import { getCookieStorage, storageBuilder } from '../../../src/lib/util';

describe('util', () => {
    describe('storageBuilder', () => {
        const testObject = {
            name: 'test',
            id: 'abc',
            path: '/users/test/Downloads',
        };

        it('works with sessionStorage', () => {
            const storage = storageBuilder(sessionStorage, 'test_session_storage');
            let data = storage.getStorage();
            expect(data).to.deep.equal({});
            storage.setStorage(testObject);

            data = storage.getStorage();
            expect(data).to.deep.equal(testObject);

            storage.removeStorage();
            data = storage.getStorage();
            expect(data).to.deep.equal({});
        });

        it('works with localStorage', () => {
            const storage = storageBuilder(localStorage, 'test_local_storage');
            let data = storage.getStorage();
            expect(data).to.deep.equal({});
            storage.setStorage(testObject);

            data = storage.getStorage();
            expect(data).to.deep.equal(testObject);

            storage.removeStorage();
            data = storage.getStorage();
            expect(data).to.deep.equal({});
        });

        it('works with cookie storage', () => {
            const storage = storageBuilder(getCookieStorage(), 'test_cookie_storage');
            let data = storage.getStorage();
            expect(data).to.deep.equal({});
            storage.setStorage(testObject);

            data = storage.getStorage();
            expect(data).to.deep.equal(testObject);

            storage.removeStorage();
            data = storage.getStorage();
            expect(data).to.deep.equal({});
        });
    });
});
