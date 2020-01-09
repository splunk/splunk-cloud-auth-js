import { SplunkErrorParams } from '@splunkdev/cloud-sdk/src/client';

/**
 * SplunkAuthError.
 */
export class SplunkAuthError extends Error implements SplunkErrorParams {
    public code?: string;

    public details?: object | any[];

    public httpStatusCode?: number;

    public moreInfo?: string;

    /**
     * Constructs a SplunkAuthError from SplunkErrorParams or an error message.
     * @param errorParams SplunkErrorParams or a string.
     */
    constructor(errorParameters: SplunkErrorParams | string) {
        super(typeof errorParameters === 'string' ? errorParameters : JSON.stringify(errorParameters));
        if (typeof errorParameters !== 'string') {
            this.message = errorParameters.message || this.message;
            this.code = errorParameters.code;
            this.details = errorParameters.details;
            this.moreInfo = errorParameters.moreInfo;
            this.httpStatusCode = errorParameters.httpStatusCode;
        }
    }
}
