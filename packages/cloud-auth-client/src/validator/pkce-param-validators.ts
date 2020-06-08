/**
 * Copyright 2020 Splunk, Inc.
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

import { PKCEOAuthRedirectParams } from '../auth/pkce-auth-manager';
import {
    ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND,
    SplunkOAuthError,
} from '../error/splunk-oauth-error';

/**
 * Validates URL seach parameters for the PKCE flow.
 * @param searchParameters URL search parameters.
 */
export function validateSearchParameters(searchParameters: URLSearchParams): void {
    // URL contains an error from the identity service redirect.
    if (searchParameters.get('error') || searchParameters.get('error_description')) {
        throw new SplunkOAuthError(
            String(searchParameters.get('error_description')),
            String(searchParameters.get('error'))
        );
    }

    // Otherwise, there is no error and the search parameters are expected to contain a well-formed access code and
    // state or a user has landed on the page for the first time and search parameters are empty.
    if (!searchParameters.get('code')) {
        throw new SplunkOAuthError(
            'Unable to parse the code search parameter from the url.',
            ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND
        );
    }

    if (!searchParameters.get('state')) {
        throw new SplunkOAuthError(
            'Unable to parse the state search parameter from the url.',
            ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND
        );
    }
}

/**
 * Validate OAuth parameters.
 * @param parameters OAuth Paremeters.
 */
export function validateOAuthParameters(parameters: PKCEOAuthRedirectParams): void {
    if (!parameters.state) {
        throw new SplunkOAuthError('Unable to retrieve state from redirect params storage.');
    }

    if (!parameters.codeVerifier) {
        throw new SplunkOAuthError('Unable to retrieve codeVerifier from redirect params storage.');
    }

    if (!parameters.codeChallenge) {
        throw new SplunkOAuthError('Unable to retrieve codeChallenge from redirect params storage.');
    }
}
