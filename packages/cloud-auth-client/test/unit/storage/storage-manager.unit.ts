
import { AuthClientError } from '../../../src/errors/auth-client-error';
import { StorageFactory } from '../../../src/storage/storage-factory';
import { StorageManager } from '../../../src/storage/storage-manager';

const STORAGE_NAME = 'some-storage-name';
const STORAGE_KEY_0 = 'key0';
const STORAGE_KEY_1 = 'key1';
const STORAGE_VALUE_0 = '{"key_0":"value_0"}';
const STORAGE_VALUE_1 = '{"key_1":"value_1"}';

describe('StorageManager', () => {
    let sessionStorageMock: Storage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dataBlob: any;

    beforeEach(() => {
        jest.spyOn(StorageFactory, 'get').mockImplementation(() => { return sessionStorageMock; });
        dataBlob = {
            key0: STORAGE_VALUE_0
        };
        sessionStorageMock = {
            length: 0,
            clear: jest.fn(),
            getItem: jest.fn(),
            key: jest.fn(),
            removeItem: jest.fn(),
            setItem: jest.fn(),
        };
    });

    describe('constructor', () => {
        it('creates a new instance of StorageManager', () => {
            // Act
            const result = new StorageManager(STORAGE_NAME);

            // Assert
            expect(result).not.toBeNull();
        });
    });

    describe('storageName', () => {
        it('returns the storage name', () => {
            // Arrange
            const storageManager = new StorageManager(STORAGE_NAME);

            // Act/Assert
            expect(storageManager.storageName).toEqual(STORAGE_NAME);
        });
    });

    describe('get', () => {
        let storageManager: StorageManager;

        beforeEach(() => {
            storageManager = new StorageManager(STORAGE_NAME);
        });

        it('returns data blob value as reference by key', () => {
            // Arrange
            sessionStorageMock.getItem = jest.fn().mockImplementation(() => {
                return JSON.stringify(dataBlob);
            });

            // Act
            const result = storageManager.get(STORAGE_KEY_0);

            // Assert
            expect(result).toEqual(STORAGE_VALUE_0);
            expect(sessionStorageMock.getItem).toBeCalledWith(STORAGE_NAME);
            expect(sessionStorageMock.getItem).toBeCalledTimes(1);
        });

        it('returns entire storage blob when key input is not present', () => {
            // Arrange
            sessionStorageMock.getItem = jest.fn().mockImplementation(() => {
                return JSON.stringify(dataBlob);
            });

            // Act
            const result = storageManager.get();

            // Assert
            expect(result).toStrictEqual(dataBlob);
            expect(sessionStorageMock.getItem).toBeCalledWith(STORAGE_NAME);
            expect(sessionStorageMock.getItem).toBeCalledTimes(1);
        });

        it('returns undefined when key input is not present', () => {
            // Act
            const result = storageManager.get();

            // Assert
            expect(result).toStrictEqual(undefined);
            expect(sessionStorageMock.getItem).toBeCalledWith(STORAGE_NAME);
            expect(sessionStorageMock.getItem).toBeCalledTimes(1);
        });

        it('throws AuthClientError when unable to parse storage string', () => {
            // Arrange
            sessionStorageMock.getItem = jest.fn().mockImplementation(() => {
                return 'malformedJson';
            });

            // Act/Assert
            expect(() => { storageManager.get(); })
                .toThrow(new AuthClientError('Unable to parse storage string: some-storage-name'));
            expect(sessionStorageMock.getItem).toBeCalledWith(STORAGE_NAME);
            expect(sessionStorageMock.getItem).toBeCalledTimes(1);
        });
    });

    describe('set', () => {
        let storageManager: StorageManager;

        beforeEach(() => {
            storageManager = new StorageManager(STORAGE_NAME);
        });

        it('with key reference sets a data blob at the given key property', () => {
            // Arrange
            sessionStorageMock.getItem = jest.fn().mockImplementation(() => {
                return JSON.stringify(dataBlob);
            });

            // Act
            storageManager.set(STORAGE_VALUE_1, STORAGE_KEY_1);

            // Assert
            expect(sessionStorageMock.getItem).toBeCalledWith(STORAGE_NAME);
            expect(sessionStorageMock.getItem).toBeCalledTimes(1);
            expect(sessionStorageMock.setItem)
                .toBeCalledWith(STORAGE_NAME, JSON.stringify({ key0: STORAGE_VALUE_0, key1: STORAGE_VALUE_1 }));
            expect(sessionStorageMock.setItem).toBeCalledTimes(1);
        });

        it('with key reference and undefined initial storage sets a data blob at the given key property', () => {
            // Arrange
            sessionStorageMock.getItem = jest.fn().mockImplementation(() => {
                return null;
            });

            // Act
            storageManager.set(STORAGE_VALUE_1, STORAGE_KEY_1);

            // Assert
            expect(sessionStorageMock.getItem).toBeCalledWith(STORAGE_NAME);
            expect(sessionStorageMock.getItem).toBeCalledTimes(1);
            expect(sessionStorageMock.setItem)
                .toBeCalledWith(STORAGE_NAME, JSON.stringify({ key1: STORAGE_VALUE_1 }));
            expect(sessionStorageMock.setItem).toBeCalledTimes(1);
        });

        it('without key reference sets the entire data blob', () => {
            // Act
            storageManager.set(STORAGE_VALUE_1);

            // Assert
            expect(sessionStorageMock.getItem).not.toBeCalledWith();
            expect(sessionStorageMock.setItem)
                .toBeCalledWith(STORAGE_NAME, JSON.stringify(STORAGE_VALUE_1));
            expect(sessionStorageMock.setItem).toBeCalledTimes(1);
        });

        it('throws AuthClientError when Storage.setItem fails', () => {
            // Arrange
            sessionStorageMock.setItem = jest.fn().mockImplementation(() => {
                throw new Error('error in setItem');
            });

            // Act/Assert
            expect(() => { storageManager.set(STORAGE_VALUE_1); })
                .toThrow(new AuthClientError('Unable to set storage: some-storage-name'));
            expect(sessionStorageMock.getItem).not.toBeCalledWith();
            expect(sessionStorageMock.setItem)
                .toBeCalledWith(STORAGE_NAME, JSON.stringify(STORAGE_VALUE_1));
            expect(sessionStorageMock.setItem).toBeCalledTimes(1);
        });
    });

    describe('delete', () => {
        let storageManager: StorageManager;

        beforeEach(() => {
            storageManager = new StorageManager(STORAGE_NAME);
        });

        it('removes data blob from storage', () => {
            // Act
            storageManager.delete();

            // Assert
            expect(sessionStorageMock.removeItem).toBeCalledWith(STORAGE_NAME);
            expect(sessionStorageMock.removeItem).toBeCalledTimes(1);
        });

        it('with key reference and datablob removes data at given key property', () => {
            // Arrange
            sessionStorageMock.getItem = jest.fn().mockImplementation(() => {
                return JSON.stringify(dataBlob);
            });

            // Act
            storageManager.delete(STORAGE_KEY_0);

            // Assert
            expect(sessionStorageMock.setItem)
                .toBeCalledWith(STORAGE_NAME, JSON.stringify({}));
            expect(sessionStorageMock.setItem).toBeCalledTimes(1);
        });

        it('with key reference and no datablob does nothing', () => {
            // Arrange
            sessionStorageMock.getItem = jest.fn().mockImplementation(() => {
                return JSON.stringify(undefined);
            });

            // Act
            storageManager.delete(STORAGE_KEY_0);

            // Assert
            expect(sessionStorageMock.setItem).not.toBeCalled();
        });

        it('throws AuthClientError when Storage.removeItem fails', () => {
            // Arrange
            sessionStorageMock.removeItem = jest.fn().mockImplementation(() => {
                throw new Error('error in removeItem');
            });

            // Act/Assert
            expect(() => { storageManager.delete(); })
                .toThrow(new AuthClientError('Unable to remove storage: some-storage-name'));
            expect(sessionStorageMock.removeItem).toBeCalledWith(STORAGE_NAME);
            expect(sessionStorageMock.removeItem).toBeCalledTimes(1);
        });
    });

    describe('clear', () => {
        let storageManager: StorageManager;

        beforeEach(() => {
            storageManager = new StorageManager(STORAGE_NAME);
        });

        it('with key clears data blob from storage at the given key property', () => {
            // Arrange
            sessionStorageMock.getItem = jest.fn().mockImplementation(() => {
                return JSON.stringify(dataBlob);
            });

            // Act
            storageManager.clear(STORAGE_KEY_0);

            // Assert
            expect(sessionStorageMock.getItem).toBeCalledWith(STORAGE_NAME);
            expect(sessionStorageMock.getItem).toBeCalledTimes(1);
            expect(sessionStorageMock.setItem).toBeCalledWith(STORAGE_NAME, JSON.stringify({ key0: {} }));
            expect(sessionStorageMock.setItem).toBeCalledTimes(1);
        });

        it('clears entire data blob from storage', () => {
            // Act
            storageManager.clear();

            // Assert
            expect(sessionStorageMock.getItem).not.toBeCalled();
            expect(sessionStorageMock.setItem).toBeCalledWith(STORAGE_NAME, '{}');
            expect(sessionStorageMock.setItem).toBeCalledTimes(1);
        });
    });
});
