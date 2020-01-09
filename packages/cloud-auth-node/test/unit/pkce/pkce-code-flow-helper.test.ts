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

import 'buffer';
import { assert } from 'chai';
import * as crypto from 'crypto';
import 'mocha';
import * as sinon from 'sinon';
import { PKCECodeFlowHelper } from '../../../src/pkce/pkce-auth-manager';
import '../fixture/test-setup';

describe('PKCECodeFlowHelper', () => {
    const sandbox: sinon.SinonSandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });

    describe('createCodeChallenge()', () => {
        it('should return a code challenge.', async () => {
            // Arrange
            const EXPECTED_CODE_CHALLENGE = 'ypeBEsobvcr6wjGzmiPcTaeG7_gUfE5yuYB3ha_uSLs';
            const SHA256 = 'sha256';
            const MOCK_CODE_VERIFIER = 'a';
            const spyCreateHash = sandbox.spy(crypto, 'createHash');

            // Act
            const result = PKCECodeFlowHelper.createCodeChallenge(MOCK_CODE_VERIFIER);

            // Assert
            assert.equal(result, EXPECTED_CODE_CHALLENGE);
            assert(spyCreateHash.calledOnce, 'crypto.createHash called once');
            assert(
                spyCreateHash.calledWith(SHA256),
                `crypto.createHash called with ${SHA256}`);
        });
    });

    describe('createCodeVerifier()', () => {
        it('should return a code verifier.', () => {
            // Arrange
            const LENGTH_OF_CODE_VERIFIER = 45;
            const spyRandomBytes = sandbox.spy(crypto, 'randomBytes');

            // Act
            const result = PKCECodeFlowHelper.createCodeVerifier(LENGTH_OF_CODE_VERIFIER);

            // Assert
            assert.isNotNull(result);
            assert.isFalse(result.includes('+'));
            assert.isFalse(result.includes('/'));
            assert.isFalse(result.includes('='));
            assert(spyRandomBytes.calledOnce, 'crypto.randomBytes called once');
            assert(
                spyRandomBytes.calledWith(LENGTH_OF_CODE_VERIFIER),
                `crypto.randomBytes called with ${LENGTH_OF_CODE_VERIFIER}`);
        });

        it('should throw SplunkAuthError when length of code verifier is less than 43', () => {
            // Arrange
            const LESS_THAN_43 = 42;

            // Act/Assert
            assert.throws(() => PKCECodeFlowHelper.createCodeVerifier(LESS_THAN_43));
        });

        it('should throw SplunkAuthError when length of code verifier is greater than 128', () => {
            // Arrange
            const GREATER_THAN_128 = 129;

            // Act/Assert
            assert.throws(() => PKCECodeFlowHelper.createCodeVerifier(GREATER_THAN_128));
        });
    });
});
