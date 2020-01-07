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

import { AuthManager } from '@splunkdev/cloud-sdk/src/auth_manager';
import {
    AccessTokenResponse,
    AuthManagerSettings,
    AuthProxy,
    BaseAuthManager,
    SplunkAuthError
} from '@splunkdev/splunk-cloud-auth-common';

const MILLISECONDS_IN_SECOND = 1000;
const TOKEN_EXPIRY_BUFFER_MILLISECONDS = 30000;

/**
 * ClientAuthManagerSettings.
 */
export class ClientAuthManagerSettings extends AuthManagerSettings {
    public clientSecret: string;
    public grantType: string = 'client_credentials';

    /**
     * ClientAuthManagerSettings.
     * @param host Host.
     * @param scope Scope.
     * @param clientId Client Id.
     * @param clientSecret Client secret.
     * @param grantType Grant type.
     */
    constructor(host: string, scope: string, clientId: string, clientSecret: string, grantType: string) {
        super(host, scope, clientId);
        this.clientSecret = clientSecret;
        this.grantType = grantType;
    }
}

/**
 * ClientAuthManager enables authentication with Splunk Cloud Services services using client credentials.
 */
export class ClientAuthManager extends BaseAuthManager<ClientAuthManagerSettings> implements AuthManager {

    /**
     * ClientAuthManager constructor.
     * @param authSettings ClientAuthManagerSettings.
     * @param authProxy AuthProxy.
     */
    public constructor(authSettings: ClientAuthManagerSettings, authProxy?: AuthProxy) {
        super(authSettings);
        this.authProxy = authProxy || new AuthProxy(this.authSettings.host);
    }

    private authProxy: AuthProxy;

    /**
     * Gets the access token.
     * Calls will only be made to the auth endpoint when token is no longer authenticated or it is about to expire.
     */
    public async getAccessToken(): Promise<string> {
        // allow for a 30 second buffer to trigger access token update.
        if (this.authContext.accessToken
            && this.authContext.tokenExpiration > new Date().getTime() + TOKEN_EXPIRY_BUFFER_MILLISECONDS) {
            return new Promise<string>((resolve) => resolve(this.authContext.accessToken));
        }

        if (!this.authSettings.clientId) {
            throw new SplunkAuthError('clientId is not specified.');
        }

        if (!this.authSettings.clientSecret) {
            throw new SplunkAuthError('clientSecret is not specified.');
        }

        if (!this.authSettings.grantType) {
            throw new SplunkAuthError('grantType is not specified.');
        }

        return this.authProxy.clientAccessToken(
            this.authSettings.clientId,
            this.authSettings.clientSecret,
            this.authSettings.grantType,
            this.authSettings.scope)
            .then((res: AccessTokenResponse) => {
                this.authContext.accessToken = res.access_token;
                this.authContext.idToken = res.id_token;
                this.authContext.tokenExpiration = new Date().getTime() + res.expires_in * MILLISECONDS_IN_SECOND;
                this.authContext.tokenType = res.token_type;
                return this.authContext.accessToken;
            });
    }

    /**
     * Checks whether the client is authenticated by checking for a token and comparing against the expiration time.
     */
    public isAuthenticated(): boolean {
        if (this.authContext.accessToken && this.authContext.tokenExpiration > new Date().getTime()) {
            return true;
        }
        return false;
    }
}
