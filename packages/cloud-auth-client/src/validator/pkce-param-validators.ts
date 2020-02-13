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

import { PKCEOAuthRedirectParams } from "../auth/pkce-auth-manager";
import { SplunkOAuthError } from "../error/splunk-oauth-error";

/**
 * Validates URL seach parameters for the PKCE flow.
 * @param searchParameters URL search parameters.
 */
export function validateSearchParameters(searchParameters: URLSearchParams): void {
    if (searchParameters.get('error') ||
        searchParameters.get('error_description')) {
        throw new SplunkOAuthError(
            String(searchParameters.get('error_description')),
            String(searchParameters.get('error')));
    }

    if (!searchParameters.get('code')) {
        throw new SplunkOAuthError('Unable to parse the code search parameter from the url.', 'token_not_found');
    }

    if (!searchParameters.get('state')) {
        throw new SplunkOAuthError('Unable to parse the state search parameter from the url.', 'token_not_found');
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
}