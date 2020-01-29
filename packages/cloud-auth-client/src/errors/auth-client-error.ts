/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

/**
 * AuthClientError.
 */
export class AuthClientError implements Error {
    /**
     * AuthClientError constructor.
     * @param message Error message.
     * @param stack Error stack trace.
     */
    public constructor(message: string, stack?: string) {
        this.name = 'AuthClientError';
        this.message = message;
        this.code = 500;
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
    public code: number;

    /**
     * Error stack trace.
     */
    public stack?: string | undefined;
}
