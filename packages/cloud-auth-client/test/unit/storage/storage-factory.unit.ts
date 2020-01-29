/* eslint-disable @typescript-eslint/no-explicit-any */

import { CookieStorage } from 'cookie-storage';

import { StorageFactory } from '../../../src/storage/storage-factory';
import { mockWindowProperty } from '../fixture/test-setup';

const DUMMY_STORAGE_KEY = 'splunk-test-storage';

describe('StorageFactory', () => {
    describe('get', () => {
        describe('when sessionStorage exists', () => {
            const sessionStorageMock: Storage = {
                length: 0,
                clear: jest.fn(),
                getItem: jest.fn(),
                key: jest.fn(),
                removeItem: jest.fn(),
                setItem: jest.fn(),
            };
            mockWindowProperty('sessionStorage', sessionStorageMock);

            it('returns SessionStorage', () => {
                // Act
                const result = StorageFactory.get();

                // Assert
                expect(result).not.toBeNull();
                expect(sessionStorageMock.setItem).toBeCalledWith(DUMMY_STORAGE_KEY, DUMMY_STORAGE_KEY);
                expect(sessionStorageMock.removeItem).toBeCalledWith(DUMMY_STORAGE_KEY);
            });
        });

        describe('when sessionStorage does not exist', () => {
            mockWindowProperty('sessionStorage', undefined);

            it('returns CookieStorage', () => {
                // Act
                const result = StorageFactory.get();

                // Assert
                expect(result).not.toBeNull();
                expect(result).toBeInstanceOf(CookieStorage);
            });
        });

        describe('when sessionStorage throws error', () => {
            const sessionStorageMock: Storage = {
                length: 0,
                clear: jest.fn(),
                getItem: jest.fn(),
                key: jest.fn(),
                removeItem: jest.fn(),
                setItem: jest.fn().mockImplementation(() => {
                    throw new Error('dummy error');
                }),
            };
            mockWindowProperty('sessionStorage', sessionStorageMock);

            it('returns CookieStorage', () => {
                // Act
                const result = StorageFactory.get();

                // Assert
                expect(result).not.toBeNull();
                expect(result).toBeInstanceOf(CookieStorage);
                expect(sessionStorageMock.setItem).toBeCalledWith(DUMMY_STORAGE_KEY, DUMMY_STORAGE_KEY);
                expect(sessionStorageMock.removeItem).not.toBeCalled();
            });
        });
    });
});
