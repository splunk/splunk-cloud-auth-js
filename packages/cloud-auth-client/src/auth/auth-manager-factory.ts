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

import { GrantType } from '../splunk-auth-client-settings';
import { AuthManager } from './auth-manager';
import { ImplicitAuthManager, ImplicitAuthManagerSettings } from './implicit-auth-manager';
import { PKCEAuthManager, PKCEAuthManagerSettings } from './pkce-auth-manager';

/**
 * AuthManagerFactory.
 */
export class AuthManagerFactory {
    /**
     * Returns an AuthManager.
     */
    public static get(
        grantType: GrantType,
        authHost: string,
        clientId: string,
        redirectUri: string,
        tenant: string,
        region: string,
        redirectParamsStorageName: string,
        enableTenantScopedTokens: boolean,
        enableMultiRegionSupport: boolean,
    ): AuthManager {
        if (grantType.valueOf() === GrantType.PKCE.valueOf()) {
            return new PKCEAuthManager(
                new PKCEAuthManagerSettings(
                    authHost,
                    clientId,
                    redirectUri,
                    tenant,
                    region,
                    redirectParamsStorageName,
                    enableTenantScopedTokens,
                    enableMultiRegionSupport
                )
            );
        }

        return new ImplicitAuthManager(
            new ImplicitAuthManagerSettings(
                authHost,
                clientId,
                redirectUri,
                redirectParamsStorageName
            )
        );
    }
}
