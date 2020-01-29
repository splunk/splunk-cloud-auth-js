/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

/**
 * OAuthError.
 */
export class OAuthError implements Error {
    /**
     * OAuthError.
     * @param message Error message.
     * @param code Error code.
     * @param stack Error stack trace.
     */
    constructor(message: string, code: string, stack?: string) {
        this.name = 'OAuthError';
        this.message = message;
        this.code = code;
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
}
