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

/**
 * Test fixtures.
 */
export class TestData {
    public static CLIENT_ID = '0oajhsdnegG6pgNoU0h7';

    public static AUTHORIZE_URL = 'https://auth.scp.splunk.com/authorize';

    public static ACCESS_TOKEN =
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOjEsImp0aSI6I' +
        'kFULjhQdm8yMzdmTVNJZ281am01VWpqeF9vV25yRkFRWFMzMk03Rklnal9' +
        'IRW8iLCJpc3MiOiJodHRwczovL2Rldi01NDQ2NTIub2t0YXByZXZpZXcuY' +
        '29tL29hdXRoMi9kZWZhdWx0IiwiYXVkIjoiYXBpOi8vZGVmYXVsdCIsIml' +
        'hdCI6MTU1MzAzOTkyOSwiZXhwIjoxNTUzMTA1ODg2LCJjaWQiOiIwb2Fqa' +
        'HNkbmVnRzZwZ05vVTBoNyIsInVpZCI6IjAwdWo3NTNnNWtjTUFhNWhVMGg' +
        '3Iiwic2NwIjpbIm9wZW5pZCIsImVtYWlsIiwicHJvZmlsZSJdLCJzdWIiO' +
        'iJtZmh1YW5nQHRlc3QuY29tIn0.SD_s4Yu7UbrWdBqE066N_q_9BZ3to-V' +
        'SCSM0aKL6fMQ';

    public static ACCESS_TOKEN_PARSED = {
        accessToken: TestData.ACCESS_TOKEN,
        authorizeUrl: TestData.AUTHORIZE_URL,
        expiresAt: 1742425555,
        expiresIn: 99999,
        scopes: ['openid', 'email', 'profile'],
        tokenType: 'Bearer',
    };

    public static REDIRECT_OAUTH_PARAMS = {
        responseType: 'id_token',
        state: 'XOR6wwQRB0LBqpfKRP6Dpf3pEfnhTLUQwl3SduatFu17Iuq1ByIv8zkIgd55W8DU',
        nonce: 'oDk4FkakfIy2nDe5a02dQ6r4zn2WnUbAJ2FGZ2n71ps7XRE5RwQf4bLjbQjxhJCi',
        scopes: ['openid', 'email', 'profile'],
        clientId: TestData.CLIENT_ID,
        urls: {
            authorizeUrl: TestData.AUTHORIZE_URL,
        },
    };
}
