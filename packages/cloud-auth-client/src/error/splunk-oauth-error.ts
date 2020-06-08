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

/**
 * Error code that is used when a well formed access token is not found in the OAuth parameters within the URL search
 * string.
 */
export const ERROR_CODE_OAUTH_PARAMS_TOKEN_NOT_FOUND = 'token_not_found';

/**
 * Error code that is used when the user has not signed the Splunk Cloud Services Terms of Service.
 */
export const ERROR_CODE_UNSIGNED_TOS = 'unsignedtos';

/**
 * SplunkOAuthError.
 */
export class SplunkOAuthError implements Error {
    /**
     * SplunkOAuthError.
     * @param message Error message.
     * @param code Error code.
     * @param stack Error stack trace.
     */
    constructor(message: string, code?: string, stack?: string) {
        this.name = 'SplunkOAuthError';
        this.message = message;
        this.code = code || 'oauth_error';
        this.stack = stack;
    }

    /**
     * Error name.
     */
    public name: string;

    /**
     * Error message.
     */
    public message: string;

    /**
     * Error code.
     */
    public code: string;

    /**
     * Error stack.
     */
    public stack?: string | undefined;

    /**
     * ToString method.
     */
    public toString(): string {
        return `Error: ${this.message}, Code: ${this.code}`;
    }
}
