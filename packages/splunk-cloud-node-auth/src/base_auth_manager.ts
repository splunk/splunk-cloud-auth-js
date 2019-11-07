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

/**
 * AuthContext can be used to store the context required for authentication including the auth token itself.
 */
export class AuthContext {
    /**
     * Token expiration time in milliseconds since epoch.
     */
    public tokenExpiration: number = 0;

    /**
     * Token type.
     */
    public tokenType: string = '';

    /**
     * Access token.  This is the token used for authorization.
     */
    public accessToken: string = '';

    /**
     * Id token.
     */
    public idToken: string = '';

    /**
     * Scope.
     */
    public scope: string = '';
}

/**
 * AuthManagerSettings can be used to store common fields required to authenticate.
 */
export abstract class AuthManagerSettings {
    /**
     * Host endpoint.
     */
    public host: string;

    /**
     * Scope.
     */
    public scope: string;

    /**
     * Client Id.
     */
    public clientId: string;

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
    protected readonly HEADERS_DEFAULT = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    protected readonly HEADERS_URLENCODED = {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    protected readonly DEFAULT_SCOPE: string = 'openid email profile';
    protected readonly SCOPE_OPENID = 'openid';
    protected readonly PATH_AUTHN: string = '/authn';
    protected readonly PATH_AUTHORIZATION: string = '/authorize';
    protected readonly PATH_TOKEN: string = '/token';
    protected readonly PATH_TOKEN_CSRF: string = '/csrfToken';

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
}
