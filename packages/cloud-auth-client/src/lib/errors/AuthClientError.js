/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

class AuthClientError {
    constructor(msg) {
        this.name = 'AuthClientError';
        this.message = msg;
        this.errorCode = 'INTERNAL';
    }
}

export default AuthClientError;
