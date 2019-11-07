export interface SplunkErrorParams {
    message: string;
    code?: string;
    httpStatusCode?: number;
    details?: any | any[];
    moreInfo?: string;
}

export class SplunkAuthError extends Error implements SplunkErrorParams {
    public code?: string;
    public httpStatusCode?: number;
    public details?: object | any[];
    public moreInfo?: string;

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
