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
 * SplunkAuthClientError.
 */
export class SplunkAuthClientError implements Error {
    /**
     * SplunkAuthClientError constructor.
     * @param message Error message.
     * @param stack Error stack trace.
     */
    public constructor(message: string, code?: string, stack?: string) {
        this.name = 'SplunkAuthClientError';
        this.message = message;
        this.code = code || 'internal_error';
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
     * Error stack trace.
     */
    public stack?: string | undefined;
}
