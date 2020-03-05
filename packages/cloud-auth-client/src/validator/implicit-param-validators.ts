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

import { ImplicitOAuthRedirectParams } from '../auth/implicit-auth-manager';
import {
    ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND,
    SplunkOAuthError,
} from '../error/splunk-oauth-error';

/**
 * Validates URL hash parameters for the Implicit flow.
 * @param searchParameters URL hash parameters.
 */
export function validateHashParameters(searchParameters: URLSearchParams): void {
    // URL contains an error from the identity service redirect.
    if (searchParameters.get('error') || searchParameters.get('error_description')) {
        throw new SplunkOAuthError(
            String(searchParameters.get('error_description')),
            String(searchParameters.get('error'))
        );
    }

    // Otherwise, there is no error and the search parameters are expected to contain a well-formed access token,
    // expiry and token type or a user has landed on the page for the first time and search parameters are empty.
    if (!searchParameters.get('access_token')) {
        throw new SplunkOAuthError(
            'Unable to parse access_token hash parameter from the url.',
            ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND
        );
    }

    if (!searchParameters.get('expires_in')) {
        throw new SplunkOAuthError(
            'Unable to parse expires_in hash parameter from the url.',
            ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND
        );
    }

    if (!searchParameters.get('token_type')) {
        throw new SplunkOAuthError(
            'Unable to parse token_type hash parameter from the url.',
            ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND
        );
    }
}

/**
 * Validate OAuth parameters.
 * @param parameters OAuth Paremeters.
 */
export function validateOAuthParameters(parameters: ImplicitOAuthRedirectParams): void {
    if (!parameters.state) {
        throw new SplunkOAuthError('Unable to retrieve state from redirect params storage.');
    }

    if (!parameters.scope) {
        throw new SplunkOAuthError('Unable to retrieve scope from redirect params storage.');
    }
}
