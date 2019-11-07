import { SplunkErrorParams } from '@splunkdev/cloud-sdk/client';

/**
 * SplunkAuthError.
 */
export class SplunkAuthError extends Error implements SplunkErrorParams {
    public code?: string;
    public httpStatusCode?: number;
    public details?: object | any[];
    public moreInfo?: string;

    /**
     * Constructs a SplunkAuthError from SplunkErrorParams or an error message.
     * @param errorParams SplunkErrorParams or a string.
     */
    constructor(errorParams: SplunkErrorParams | string) {
        super(typeof errorParams === 'string' ? errorParams : JSON.stringify(errorParams));
        if (typeof errorParams !== 'string') {
            this.message = errorParams.message || this.message;
            this.code = errorParams.code;
            this.details = errorParams.details;
            this.moreInfo = errorParams.moreInfo;
            this.httpStatusCode = errorParams.httpStatusCode;
        }
    }
}
