/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

class OAuthError {
    constructor(errorCode, summary) {
        this.name = 'OAuthError';
        this.message = summary;
        this.errorCode = errorCode;
    }
}

export default OAuthError;
