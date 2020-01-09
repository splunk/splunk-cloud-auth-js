/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

export default {
    REDIRECT_PATH_PARAMS_NAME: 'redirect-path',
    REDIRECT_OAUTH_PARAMS_NAME: 'redirect-oauth-params',
    REDIRECT_PARAMS_STORAGE_NAME: 'splunk-redirect-params-storage',
    TOKEN_STORAGE_NAME: 'splunk-token-storage',
    MAX_CLOCK_SKEW: 600, // maximum clock skew allowed when validating JWT
    DEFAULT_AUTO_TOKEN_RENEWAL_BUFFER: 720, // Auto renew tokens 720 seconds before the token expires
};
