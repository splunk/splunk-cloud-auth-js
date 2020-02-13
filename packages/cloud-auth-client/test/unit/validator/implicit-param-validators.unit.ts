import { SplunkOAuthError } from '../../../src/error/splunk-oauth-error';
import { validateHashParameters, validateOAuthParameters } from '../../../src/validator/implicit-param-validators';

describe('validateHashParameters', () => {
    it('successfully validates parameters', () => {
        // Arrange
        const searchParameters = new URLSearchParams();
        searchParameters.append('access_token', 'abcdef');
        searchParameters.append('expires_in', '1000');
        searchParameters.append('token_type', 'token-type');

        // Act/Arrange
        expect(() => validateHashParameters(searchParameters)).not.toThrow();
    });

    it('throws SplunkOAuthError when parameters contains error and error_description', () => {
        // Arrange
        const error = 'some error';
        const errorDescription = 'some error description';
        const searchParameters = new URLSearchParams();
        searchParameters.append('error', error);
        searchParameters.append('error_description', errorDescription);

        // Act/Arrange
        expect(() => validateHashParameters(searchParameters)).toThrow(new SplunkOAuthError(errorDescription, error));
    });

    it('throws SplunkOAuthError when parameters does not contain access_token', () => {
        // Arrange
        const searchParameters = new URLSearchParams();

        // Act/Arrange
        expect(() => validateHashParameters(searchParameters))
            .toThrow(
                new SplunkOAuthError('Unable to parse access_token hash parameter from the url.', 'token_not_found'));
    });

    it('throws SplunkOAuthError when parameters does not contain expires_in', () => {
        // Arrange
        const searchParameters = new URLSearchParams();
        searchParameters.append('access_token', 'abcdef');

        // Act/Arrange
        expect(() => validateHashParameters(searchParameters))
            .toThrow(
                new SplunkOAuthError('Unable to parse expires_in hash parameter from the url.', 'token_not_found'));
    });

    it('throws SplunkOAuthError when parameters does not contain token_type', () => {
        // Arrange
        const searchParameters = new URLSearchParams();
        searchParameters.append('access_token', 'abcdef');
        searchParameters.append('expires_in', '1000');

        // Act/Arrange
        expect(() => validateHashParameters(searchParameters))
            .toThrow(
                new SplunkOAuthError('Unable to parse token_type hash parameter from the url.', 'token_not_found'));
    });
});

describe('validateOAuthParameters', () => {
    it('successfully validates parameters', () => {
        // Arrange
        const searchParameters = {
            state: 'state',
            scope: 'scope'
        };

        // Act/Arrange
        expect(() => validateOAuthParameters(searchParameters)).not.toThrow();
    });

    it('throws SplunkOAuthError when parameters does not contain state', () => {
        // Arrange
        const searchParameters = {
            state: undefined,
            scope: undefined
        };

        // Act/Arrange
        expect(() => validateOAuthParameters(searchParameters))
            .toThrow(new SplunkOAuthError('Unable to retrieve state from redirect params storage.', 'token_not_found'));
    });

    it('throws SplunkOAuthError when parameters does not contain scope', () => {
        // Arrange
        const searchParameters = {
            state: 'state',
            scope: undefined
        };

        // Act/Arrange
        expect(() => validateOAuthParameters(searchParameters))
            .toThrow(new SplunkOAuthError('Unable to retrieve scope from redirect params storage.', 'token_not_found'));
    });
});
