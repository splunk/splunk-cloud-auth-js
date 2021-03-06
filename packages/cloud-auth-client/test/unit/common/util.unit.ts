import {
    clearWindowLocationFragments,
    createCodeChallenge,
    encodeCodeVerifier,
    generateCodeVerifier,
    generateRandomString,
    generateRegionBasedAuthHost,
    generateTenantBasedAuthHost,
} from '../../../src/common/util';
import { SplunkAuthClientError } from '../../../src/error/splunk-auth-client-error';
import { mockWindowProperty } from '../fixture/test-setup';

const TITLE_PARAM = 'title';
const PATH_NAME_PARAM = 'pathname';

describe('util', () => {
    describe('generateRandomString', () => {
        const length = 5;
        const randomBytesMock = new Uint32Array([9, 120, 122, 35, 1]);
        const cryptoMock = {
            getRandomValues: jest.fn().mockImplementation(() => {
                return randomBytesMock;
            }),
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

    describe('clearWindowLocationFragments', () => {
        const historyMock = {
            replaceState: jest.fn(),
        };
        const documentMock = {
            title: TITLE_PARAM,
        };

        afterEach(() => {
            jest.clearAllMocks();
        });

        mockWindowProperty('history', historyMock);
        mockWindowProperty('document', documentMock);

        describe('with window location search', () => {
            const SEARCH_VALUE = `?code=value&redirect_uri=http://redirect.com&requestId=qwert1234&state=zxcv09877&accept_tos=1`;
            const SEARCH_WITH_ADDITIONAL_VALUE = `${SEARCH_VALUE}&search=value`;

            describe('with search params', () => {
                const locationMock = {
                    pathname: PATH_NAME_PARAM,
                    search: SEARCH_VALUE,
                };

                mockWindowProperty('location', locationMock);

                it('replaces state in history', () => {
                    // Act
                    clearWindowLocationFragments();

                    // Assert
                    expect(historyMock.replaceState).toBeCalledWith(
                        null,
                        TITLE_PARAM,
                        `${PATH_NAME_PARAM}`
                    );
                    expect(historyMock.replaceState).toBeCalledTimes(1);
                });
            });

            describe('with search params and additional value', () => {
                const locationMock = {
                    pathname: PATH_NAME_PARAM,
                    search: SEARCH_WITH_ADDITIONAL_VALUE,
                };

                mockWindowProperty('location', locationMock);

                it('replaces state in history', () => {
                    // Act
                    clearWindowLocationFragments();

                    // Assert
                    expect(historyMock.replaceState).toBeCalledWith(
                        null,
                        TITLE_PARAM,
                        `${PATH_NAME_PARAM}?search=value`
                    );
                    expect(historyMock.replaceState).toBeCalledTimes(1);
                });
            });
        });

        describe('with window location hash', () => {
            const HASH_VALUE = `#access_token=IAMTOKEN&expires_in=123&id_token=IAMIDTOKEN&redirect_uri=http://redirect.com&requestId=qwert1234&scope=open&state=zxcv09877&token_type=iamtype`;
            const HASH_WITH_ADDITIONAL_VALUE = `${HASH_VALUE}&hash=value`;

            describe('with hash params', () => {
                const locationMock = {
                    pathname: PATH_NAME_PARAM,
                    hash: HASH_VALUE,
                };

                mockWindowProperty('location', locationMock);

                it('replaces state in history', () => {
                    // Act
                    clearWindowLocationFragments();

                    // Assert
                    expect(historyMock.replaceState).toBeCalledWith(
                        null,
                        TITLE_PARAM,
                        `${PATH_NAME_PARAM}`
                    );
                    expect(historyMock.replaceState).toBeCalledTimes(1);
                });
            });

            describe('with hash params and additional value', () => {
                const locationMock = {
                    pathname: PATH_NAME_PARAM,
                    hash: HASH_WITH_ADDITIONAL_VALUE,
                };

                mockWindowProperty('location', locationMock);

                it('replaces state in history', () => {
                    // Act
                    clearWindowLocationFragments();

                    // Assert
                    expect(historyMock.replaceState).toBeCalledWith(
                        null,
                        TITLE_PARAM,
                        `${PATH_NAME_PARAM}#hash=value`
                    );
                    expect(historyMock.replaceState).toBeCalledTimes(1);
                });
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
        const randomBytesMock = new Uint32Array([
            1, 120, 122, 35, 1, 20, 67, 98, 30, 100,
            1, 120, 122, 35, 1, 20, 67, 98, 30, 100,
            1, 120, 122, 35, 1, 20, 67, 98, 30, 100,
            1, 120, 122, 35, 1, 20, 67, 98, 30, 100,
            1, 120, 122, 35, 1, 20, 67, 98, 30, 100
        ]);
        const cryptoMock = {
            getRandomValues: jest.fn().mockImplementation(() => {
                return randomBytesMock;
            }),
        };
        mockWindowProperty('crypto', cryptoMock);

        it('throws SplunkAuthClientError when codeVerifierLength is less than 43', () => {
            // Arrange
            const codeVerifierLength = 42;

            // Act/Assert
            expect(() => {
                generateCodeVerifier(codeVerifierLength);
            }).toThrow(
                new SplunkAuthClientError(
                    `Specified code verifier length is invalid. Length=${codeVerifierLength}`
                )
            );
        });

        it('throws SplunkAuthClientError when codeVerifierLength is greater than 128', () => {
            // Arrange
            const codeVerifierLength = 129;

            // Act/Assert
            expect(() => {
                generateCodeVerifier(codeVerifierLength);
            }).toThrow(
                new SplunkAuthClientError(
                    `Specified code verifier length is invalid. Length=${codeVerifierLength}`
                )
            );
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
    
    describe('generateRegionBasedAuthHost', () => {
        it('returns region based url', () => {
            const region = 'foo';
            const inputUrl = 'https://example.com/';
            const expectedUrl = `https://region-${region}.example.com/`;
            const url = generateRegionBasedAuthHost(inputUrl, region);
            expect(url).toEqual(expectedUrl);
        });

        it('returns url for non https protocol', () => {
            const region = 'foo';
            const inputUrl = 'http://example.com/';
            const expectedUrl = `http://example.com/`;
            const url = generateRegionBasedAuthHost(inputUrl, region);
            expect(url).toEqual(expectedUrl);
        });

        it('returns url for when region is undefined', () => {
            const region = undefined;
            const inputUrl = 'https://example.com/';
            const expectedUrl = `https://example.com/`;
            const url = generateRegionBasedAuthHost(inputUrl, region);
            expect(url).toEqual(expectedUrl);
        });

        it('returns a correct region based url for already region based url', () => {
            const region = 'foo';
            const inputUrl = 'http://region-{foo}.example.com/';
            const expectedUrl = `http://region-{foo}.example.com/`;
            const url = generateRegionBasedAuthHost(inputUrl, region);
            expect(url).toEqual(expectedUrl);
        });

        it('throws SplunkAuthClientError for invalid url', () => {
            const region = 'foo';
            const inputUrl = 'boo';

            expect(() => {
                generateRegionBasedAuthHost(inputUrl, region);
            }).toThrow(
                new SplunkAuthClientError('Invalid Auth URL')
            );
        });
    });

    describe('generateTenantBasedAuthHost', () => {
        it('returns tenant based url', () => {
            const tenant = 'foo';
            const inputUrl = 'https://example.com/';
            const expectedUrl = `https://${tenant}.example.com/`;
            const url = generateTenantBasedAuthHost(inputUrl, tenant);
            expect(url).toEqual(expectedUrl);
        });

        it('returns url for a system tenant', () => {
            const tenant = 'system';
            const inputUrl = 'https://example.com/';
            const expectedUrl = `https://example.com/`;
            const url = generateTenantBasedAuthHost(inputUrl, tenant);
            expect(url).toEqual(expectedUrl);
        });

        it('returns url for non https protocol', () => {
            const tenant = 'foo';
            const inputUrl = 'http://example.com/';
            const expectedUrl = `http://example.com/`;
            const url = generateTenantBasedAuthHost(inputUrl, tenant);
            expect(url).toEqual(expectedUrl);
        });

        it('returns a correct tenant based url for already tenant based url', () => {
            const tenant = 'foo';
            const inputUrl = 'http://{tenant}.example.com/';
            const expectedUrl = `http://{tenant}.example.com/`;
            const url = generateTenantBasedAuthHost(inputUrl, tenant);
            expect(url).toEqual(expectedUrl);
        });

        it('throws SplunkAuthClientError for invalid url', () => {
            const tenant = 'foo';
            const inputUrl = 'boo';

            expect(() => {
                generateTenantBasedAuthHost(inputUrl, tenant);
            }).toThrow(
                new SplunkAuthClientError('Invalid Auth URL')
            );
        });
    });
});
