/**
 * Copyright 2019 Splunk, Inc.
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

'use strict';

import { SplunkErrorParams } from '@splunkdev/cloud-sdk/client';
import { assert } from 'chai';
import 'mocha';
import { SplunkAuthError } from '../../../src/common/splunk-auth-error';

const ERROR_MESSAGE = 'errormessage';
const CODE = 'code';
const HTTP_STATUS_CODE = 400;
const DETAILS = {
    detail: 'errordetail'
};
const MORE_INFO = 'moreinfo';

describe('SplunkAuthError', () => {
    describe('constructor', () => {
        it('should create a new SplunkAuthError with string', () => {
            // Act
            const result = new SplunkAuthError(ERROR_MESSAGE);

            // Assert
            assert.isNotNull(result);
            assert.isUndefined(result.code);
            assert.isUndefined(result.details);
            assert.isUndefined(result.httpStatusCode);
            assert.equal(result.message, ERROR_MESSAGE);
            assert.isUndefined(result.moreInfo);
        });

        it('should create a new SplunkAuthError with SplunkErrorParams', () => {
            // Arrange
            const splunkErrorParamsStub: SplunkErrorParams = {
                code: CODE,
                details: DETAILS,
                httpStatusCode: HTTP_STATUS_CODE,
                message: ERROR_MESSAGE,
                moreInfo: MORE_INFO,
            };

            // Act
            const result = new SplunkAuthError(splunkErrorParamsStub);

            // Assert
            assert.isNotNull(result);
            assert.equal(result.code, CODE);
            assert.equal(result.details, DETAILS);
            assert.equal(result.httpStatusCode, HTTP_STATUS_CODE);
            assert.equal(result.message, ERROR_MESSAGE);
            assert.equal(result.moreInfo, MORE_INFO);
        });

        it('should create a new SplunkAuthError with SplunkErrorParams with no message', () => {
            // Arrange
            const splunkErrorParamsStub: SplunkErrorParams = {
                code: CODE,
                details: DETAILS,
                httpStatusCode: HTTP_STATUS_CODE,
                message: '',
                moreInfo: MORE_INFO,
            };

            // Act
            const result = new SplunkAuthError(splunkErrorParamsStub);

            // Assert
            assert.isNotNull(result);
            assert.equal(result.code, CODE);
            assert.equal(result.details, DETAILS);
            assert.equal(result.httpStatusCode, HTTP_STATUS_CODE);
            assert.equal(result.message, JSON.stringify(splunkErrorParamsStub));
            assert.equal(result.moreInfo, MORE_INFO);
        });
    });
});
