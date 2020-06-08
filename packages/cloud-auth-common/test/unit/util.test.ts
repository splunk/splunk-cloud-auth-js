/**
 * Copyright 2020 Splunk, Inc.
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

/* eslint-disable @typescript-eslint/camelcase */
import 'mocha';

import { assert } from 'chai';

import { generateQueryParameters } from '../../src/util';

const CLIENT_ID = 'clientId'
const REDIRECT_URI = 'https://redirect.com';
const STATE = 'state';

describe('util', () => {
    describe('generateQueryParameters', () => {
        it('generate the query parameters', () => {
            // Arrange
            const params = new Map([
                ['client_id', CLIENT_ID],
                ['redirect_uri', REDIRECT_URI],
                ['state', STATE]
            ]);
            const expectedQueryParams = `?client_id=clientId&redirect_uri=https%3A%2F%2Fredirect.com&state=state`;

            // Act
            const result = generateQueryParameters(params);

            // Assert
            assert.equal(result, expectedQueryParams);
        });

        it('generate the query parameteres given undefined and null parameter values', () => {
            // Arrange
            const params = new Map([
                ['client_id', CLIENT_ID],
                ['redirect_uri', ''],
                ['state', undefined],
                ['code', null]
            ]);
            const expectedQueryParams = `?client_id=clientId&redirect_uri=`;

            // Act
            const result = generateQueryParameters(params);

            // Assert
            assert.equal(result, expectedQueryParams);
        })

    });

});