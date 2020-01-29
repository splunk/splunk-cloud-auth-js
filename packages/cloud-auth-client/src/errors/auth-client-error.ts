/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

export class AuthClientError implements Error {
    public constructor(message: string) {
        this.name = 'AuthClientError';
        this.message = message;
        this.errorCode = 'INTERNAL';
    }

    public name: string;

    public message: string;

    public errorCode: string;
}
