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

import { AccessToken } from "../model/access-token";

/**
 * AuthManager interface.
 */
export interface AuthManager {
    /**
     * Gets redirect path from storage.
     */
    getRedirectPath(): string;
    /**
     * Sets redirect path in storage.
     * @param redirectPath Redirect path.
     */
    setRedirectPath(redirectPath: string): void;
    /**
     * Deletes redirect path in storage.
     */
    deleteRedirectPath(): void;
    /**
     * Gets an access token using the search parameters in the provided URL or the window location.
     * @param url Url.
     */
    getAccessToken(url?: string): Promise<AccessToken>;
    /**
     * Generates the Authorize URL.
     * @param additionalQueryParams Additional query parameters.
     */
    generateAuthUrl(additionalQueryParams?: Map<string, string>): URL;
    /**
     * Generates the Logout URL.
     * @param redirectUrl Optional redirect URL.
     */
    generateLogoutUrl(redirectUrl: string): URL;
}
