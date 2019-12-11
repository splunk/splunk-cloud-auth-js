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

import { AuthManager } from '@splunkdev/cloud-sdk/src/auth_manager';
import { AccessTokenResponse, AuthProxy } from '../common/auth-proxy';
import { AuthManagerSettings, BaseAuthManager } from '../common/base-auth-manager';
import { SplunkAuthError } from '../common/splunk-auth-error';

const MILLISECONDS_IN_SECOND = 1000;
const TOKEN_EXPIRY_BUFFER_MILLISECONDS = 30000;

/**
 * RefreshAuthManagerSettings.
 */
export class RefreshAuthManagerSettings extends AuthManagerSettings {
    public grantType: string;
    public refreshToken: string;

    /**
     * RefreshAuthManagerSettings.
     * @param host Host.
     * @param scope Scope.
     * @param clientId Client Id.
     * @param grantType Grant type.
     * @param refreshToken Refresh token.
     */
    constructor(
        host: string,
        scope: string = 'openid',
        clientId: string,
        grantType: string = 'refresh_token',
        refreshToken: string) {
        super(host, scope, clientId);

        this.grantType = grantType;
        this.refreshToken = refreshToken;
    }
}

/**
 * RefreshAuthManager enables authentication with Splunk Cloud Services services using refresh token.
 */
export class RefreshAuthManager extends BaseAuthManager<RefreshAuthManagerSettings> implements AuthManager {

    /**
     * RefreshAuthManager constructor.
     * @param authSettings RefreshAuthManagerSettings.
     * @param authProxy AuthProxy.
     */
    public constructor(authSettings: RefreshAuthManagerSettings, authProxy?: AuthProxy) {
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

        if (!this.authSettings.grantType) {
            throw new SplunkAuthError('grantType is not specified.');
        }

        if (!this.authSettings.refreshToken) {
            throw new SplunkAuthError('refreshToken is not specified.');
        }

        return this.authProxy.refreshAccessToken(
            this.authSettings.clientId,
            this.authSettings.grantType,
            this.authSettings.scope,
            this.authSettings.refreshToken)
            .then((res: AccessTokenResponse) => {
                this.authContext.tokenExpiration = new Date().getTime() + res.expires_in * MILLISECONDS_IN_SECOND;
                this.authContext.tokenType = res.token_type;
                this.authContext.accessToken = res.access_token;
                this.authContext.idToken = res.id_token;
                this.authContext.scope = res.scope;
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
