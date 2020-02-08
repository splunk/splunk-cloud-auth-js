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
 * AuthContext can be used to store the context required for authentication including the auth token itself.
 */
export class AuthContext {
    /**
     * Access token.  This is the token used for authorization.
     */
    public accessToken = '';

    /**
     * Id token.
     */
    public idToken = '';

    /**
     * Refresh token.
     */
    public refreshToken = '';

    /**
     * Scope.
     */
    public scope = '';

    /**
     * Token expiration time in milliseconds since epoch.
     */
    public tokenExpiration = 0;

    /**
     * Token type.
     */
    public tokenType = '';
}

/**
 * AuthManagerSettings can be used to store common fields required to authenticate.
 */
export abstract class AuthManagerSettings {
    /**
     * Client Id.
     */
    public clientId: string;

    /**
     * Host endpoint.
     */
    public host: string;

    /**
     * Scope.
     */
    public scope: string;

    /**
     * AuthManagerSettings.
     * @param host Host.
     * @param scope Scope.
     * @param clientId Client Id.
     */
    constructor(host: string, scope: string, clientId: string) {
        this.host = host;
        this.scope = scope;
        this.clientId = clientId;
    }
}

/**
 * BaseAuthManager abstract class.
 */
export abstract class BaseAuthManager<T extends AuthManagerSettings> {
    protected readonly DEFAULT_SCOPE: string = 'openid email profile';

    protected readonly SCOPE_OPENID = 'openid';

    protected readonly authSettings: T;

    protected readonly authContext: AuthContext;

    /**
     * BaseAuthManager constructor.
     * @param authSettings Authentication settings.
     */
    constructor(authSettings: T) {
        this.authSettings = authSettings;
        this.authContext = new AuthContext();
    }

    /**
     * Gets the AuthContext.
     */
    get authorizationContext(): AuthContext {
        return this.authContext;
    }
}
