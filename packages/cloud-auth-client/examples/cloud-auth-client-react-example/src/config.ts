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

const {
    REACT_APP_CLIENT_ID,
    REACT_APP_REDIRECT_URI,
    REACT_APP_AUTHORIZE_URL,
    REACT_APP_AUTO_REDIRECT_TO_LOGIN,
    REACT_APP_RESTORE_PATH_AFTER_LOGIN,
    REACT_APP_MAX_CLOCK_SKEW,
    REACT_APP_QUERY_PARAMS_FOR_LOGIN,
    REACT_APP_AUTO_TOKEN_RENEWAL_BUFFER
} = process.env;

/**
 * This file contains variables used in the example React application.
 * They can be set as node environment variables or hardcoded below.
 */
export const Config = {
    CLIENT_ID: REACT_APP_CLIENT_ID || 'YOUR_CLIENT_ID',
    REDIRECT_URI: REACT_APP_REDIRECT_URI || 'https://YOUR_URL_USED_TO_REGISTER_CLIENT.com',
    ON_RESTORE_PATH: (path: string) => {
        console.log(path);
    },
    AUTHORIZE_URL: REACT_APP_AUTHORIZE_URL || 'https://auth.scp.splunk.com/authorize',
    AUTO_REDIRECT_TO_LOGIN: (REACT_APP_AUTO_REDIRECT_TO_LOGIN === 'true'), // default is true
    RESTORE_PATH_AFTER_LOGIN: (REACT_APP_RESTORE_PATH_AFTER_LOGIN === 'true'), // default is true
    MAX_CLOCK_SKEW: Number(REACT_APP_MAX_CLOCK_SKEW) || 600,
    QUERY_PARAMS_FOR_LOGIN: REACT_APP_QUERY_PARAMS_FOR_LOGIN || '',
    AUTO_TOKEN_RENEWAL_BUFFER: Number(REACT_APP_AUTO_TOKEN_RENEWAL_BUFFER) || 120
}