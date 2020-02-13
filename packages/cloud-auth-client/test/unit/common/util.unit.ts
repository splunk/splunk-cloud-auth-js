import {
    clearWindowLocationFragments,
    createCodeChallenge,
    encodeCodeVerifier,
    generateCodeVerifier,
    generateRandomString
} from '../../../src/common/util';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';
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

    describe('encodeCodeVerifier', () => {
        it('returns codeVerifier', () => {
            const codeVerifier = encodeCodeVerifier('te/st+123=&');
            expect(codeVerifier).toEqual('dGUvc3QrMTIzPSY');
        });
    });

    describe('createCodeChallenge', () => {
        it('returns codeChallenge', () => {
            const codeChallenge = createCodeChallenge('dGUvc3QrMTIzPSY');
            expect(codeChallenge).toEqual('c_xT9o0Y_HxiX-yZf9M9whB8D1Yg8W7BcU5Iiqf80DA');
        });
    });

    describe('generateCodeVerifier', () => {
        const validCodeVerifierLength = 50;
        const randomBytesMock =
            new Uint32Array([
                1, 120, 122, 35, 1, 20, 67, 98, 30, 100,
                1, 120, 122, 35, 1, 20, 67, 98, 30, 100,
                1, 120, 122, 35, 1, 20, 67, 98, 30, 100,
                1, 120, 122, 35, 1, 20, 67, 98, 30, 100,
                1, 120, 122, 35, 1, 20, 67, 98, 30, 100
            ]);
        const cryptoMock = {
            getRandomValues: jest.fn().mockImplementation(() => {
                return randomBytesMock;
            })
        };
        mockWindowProperty('crypto', cryptoMock);

        it('throws SplunkAuthClientError when codeVerifierLength is less than 43', () => {
            // Arrange
            const codeVerifierLength = 42;

            // Act/Assert
            expect(() => { generateCodeVerifier(codeVerifierLength) })
                .toThrow(new SplunkAuthClientError(
                    `Specified code verifier length is invalid. Length=${codeVerifierLength}`));
        });

        it('throws SplunkAuthClientError when codeVerifierLength is greater than 128', () => {
            // Arrange
            const codeVerifierLength = 129;

            // Act/Assert
            expect(() => { generateCodeVerifier(codeVerifierLength) })
                .toThrow(new SplunkAuthClientError(
                    `Specified code verifier length is invalid. Length=${codeVerifierLength}`));
        });

        it('returns valid codeVerifier', () => {
            // Arrange
            const expectedResult = 'B8AjBUGleoB8AjBUGleoB8AjBUGleoB8AjBUGleoB8AjBUGleo';

            // Act
            const result = generateCodeVerifier(validCodeVerifierLength);

            // Assert
            expect(result).toEqual(expectedResult);
            expect(cryptoMock.getRandomValues).toBeCalledWith(new Uint32Array(50));
            expect(cryptoMock.getRandomValues).toBeCalledTimes(1);
        });
    });
});
