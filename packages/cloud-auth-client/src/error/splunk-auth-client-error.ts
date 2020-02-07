/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
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
