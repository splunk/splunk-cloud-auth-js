import { clearWindowLocationFragments, generateRandomString } from '../../../src/common/util';
import { mockWindowProperty } from '../fixture/test-setup';

const TITLE_PARAM = 'title';
const PATH_NAME_PARAM = 'pathname';
const SEARCH_PARAM = 'search';
const HASH_VALUE = '#abc=123';

describe('util', () => {
    describe('generateRandomString', () => {
        const length = 5;
        const randomBytesMock = new Uint32Array([9, 120, 122, 35, 1]);

        const cryptoMock = {
            getRandomValues: jest.fn().mockImplementation(() => {
                return randomBytesMock;
            })
        };
        mockWindowProperty('crypto', cryptoMock);

        it('returns string', () => {
            // Arrange
            const expectedResult = 'J8AjB';

            // Act
            const result = generateRandomString(length);

            // Assert
            expect(result).toEqual(expectedResult);
            expect(cryptoMock.getRandomValues).toBeCalledWith(new Uint32Array(5));
            expect(cryptoMock.getRandomValues).toBeCalledTimes(1);
        });
    });

    describe('removeWindowLocationHash', () => {
        describe('when history exists', () => {
            const historyMock = {
                replaceState: jest.fn()
            };
            const documentMock = {
                title: TITLE_PARAM
            };
            const locationMock = {
                pathname: PATH_NAME_PARAM,
                search: SEARCH_PARAM
            };

            mockWindowProperty('history', historyMock);
            mockWindowProperty('document', documentMock);
            mockWindowProperty('location', locationMock);

            it('replaces state in history', () => {
                // Act
                clearWindowLocationFragments();

                // Assert
                expect(historyMock.replaceState).toBeCalledWith(null, TITLE_PARAM, `${PATH_NAME_PARAM}${SEARCH_PARAM}`);
                expect(historyMock.replaceState).toBeCalledTimes(1);
            });
        });

        describe('when history does not exist', () => {
            const documentMock = {
                title: TITLE_PARAM
            };
            const locationMock = {
                pathname: PATH_NAME_PARAM,
                search: SEARCH_PARAM,
                hash: HASH_VALUE
            };

            mockWindowProperty('history', {});
            mockWindowProperty('document', documentMock);
            mockWindowProperty('location', locationMock);

            it('replaces state in history', () => {
                // Act
                clearWindowLocationFragments();

                // Assert
                expect(locationMock.hash).toEqual('');
            });
        });
    });
});
