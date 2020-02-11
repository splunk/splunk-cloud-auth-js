const ACCEPTABLE_RANDOM_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklnopqrstuvwxyz0123456789';

/**
 * Generates a random string.
 * @param length Length of string.
 */
export function generateRandomString(length: number) {
    let result = '';

    const bytes = new Uint32Array(length);
    const random = window.crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i += 1) {
        result += ACCEPTABLE_RANDOM_CHARSET[random[i] % ACCEPTABLE_RANDOM_CHARSET.length];
    }
    return result;
}

/**
 * Clears the hash and search fragments from window location.
 */
export function clearWindowLocationFragments() {
    if (window.history && window.history.replaceState) {
        window.history.replaceState(
            null,
            window.document.title,
            `${window.location.pathname}${window.location.search}`);
    } else {
        window.location.hash = '';
        window.location.search = '';

    }
}
