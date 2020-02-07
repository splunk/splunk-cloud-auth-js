export const DEFAULT_AUTH_HOST = 'https://auth.scp.splunk.com/';
export const DEFAULT_AUTO_REDIRECT_TO_LOGIN = true;
export const DEFAULT_RESTORE_PATH_AFTER_LOGIN = true;
export const DEFAULT_QUERY_PARAMS_FOR_LOGIN = undefined;
export const DEFAULT_MAX_CLOCK_SKEW = 600; // maximum clock skew allowed when validating JWT
export const DEFAULT_AUTO_TOKEN_RENEWAL_BUFFER = 720; // Auto renew tokens 720 seconds before the token expires

export const REDIRECT_PATH_PARAMS_NAME = 'redirect-path';
export const REDIRECT_OAUTH_PARAMS_NAME = 'redirect-oauth-params';
export const REDIRECT_PARAMS_STORAGE_NAME = 'splunk-redirect-params-storage';
export const TOKEN_STORAGE_NAME = 'splunk-token-storage';

/**
 * OnRestorePath callback function signature.
 */
export declare type OnRestorePathFunction = (p: any) => void;

/**
 * AuthClientSettings.
 */
export class AuthClientSettings {
    /**
     * AuthClientSettings constructor.
     * @param clientId Client Id.
     * @param redirectUri Redirect URI.
     * @param onRestorePath OnRestorePath callback function.
     * @param authHost Auth host.
     * @param autoRedirectToLogin Auto-redirect to login boolean.
     * @param restorePathAfterLogin Restore path after login boolean.
     * @param maxClockSkew Maximum clock skew in seconds.
     * @param queryParamsForLogin Query parameters for logging in.
     * @param autoTokenRenewalBuffer Auto token renewal buffer in seconds.
     */
    public constructor(
        clientId: string,
        redirectUri: string,
        onRestorePath: OnRestorePathFunction | undefined = undefined,
        authHost: string = DEFAULT_AUTH_HOST,
        autoRedirectToLogin: boolean = DEFAULT_AUTO_REDIRECT_TO_LOGIN,
        restorePathAfterLogin: boolean = DEFAULT_RESTORE_PATH_AFTER_LOGIN,
        maxClockSkew: number = DEFAULT_MAX_CLOCK_SKEW,
        queryParamsForLogin: any = DEFAULT_QUERY_PARAMS_FOR_LOGIN,
        autoTokenRenewalBuffer: number = DEFAULT_AUTO_TOKEN_RENEWAL_BUFFER
    ) {
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.onRestorePath = onRestorePath;
        this.authHost = authHost === '' ? DEFAULT_AUTH_HOST : authHost;
        this.autoRedirectToLogin = autoRedirectToLogin;
        this.restorePathAfterLogin = restorePathAfterLogin;
        this.maxClockSkew = maxClockSkew;
        this.queryParamsForLogin = queryParamsForLogin;
        this.autoTokenRenewalBuffer = autoTokenRenewalBuffer
    }

    /**
     * Client Id.
     *
     * This is used to identify the app registred with the App Registry.
     */
    public clientId: string;

    /**
     * Redirect URI.
     *
     * This is used to redirect the user back to the web app after login. URI must be registered with the App Registry.
     */
    public redirectUri: string;

    /**
     * OnRestorePath callback function.
     *
     * When provided, this function is called when the user is redirected back from login, after the auth callback
     * is successfully applied. This function can be used to integrate with third-party client-side
     * routers, such as react-router intead of calling `history.replaceState`.
     */
    public onRestorePath: OnRestorePathFunction | undefined;

    /**
     * Authorize host.
     *
     * This host performs the authorization flow. Defaults to Splunk authorize server.
     */
    public authHost: string;

    /**
     * Auto-redirect to login boolean.
     *
     * If enabled, the user is automatically redirected to the login page when the AuthClient instance is created or
     * when checkAuthentication is called and the user is not already logged in. This is enabled by default but can
     * be disabled by setting it to `false`.
     */
    public autoRedirectToLogin: boolean;

    /**
     * Restore path after login boolean.
     *
     * If enabled, then the @splunkdev/cloud-auth-client lib will restore the path of the web app after redirecting
     * to login page.
     */
    public restorePathAfterLogin: boolean;

    /**
     * Maximum clock skew.
     *
     * Specifies the duration buffer in seconds for token expiration
     * (now > actualExpiration - maxClockSkew) will be considered expired
     */
    public maxClockSkew: number;

    /**
     * Query parameters for logging in.
     */
    public queryParamsForLogin: any;

    /**
     * Auto token renewal buffer.
     *
     * Specifies the duration buffer in seconds for token auto renewal.
     * (now > actualExpiration - autoTokenRenewalBuffer) will trigger an auto renewal
     */
    public autoTokenRenewalBuffer: number;
}
