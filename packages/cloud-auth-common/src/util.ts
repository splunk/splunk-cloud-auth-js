/**
 * Generates the query parameter string
 * @param params Map of the params.
 */
export function generateQueryParameters(parameters: Map<string, any>): string {
    const queryParameters: string[] = [];
    parameters.forEach((value, key) => {
        if (value !== undefined && value !== null) {
            queryParameters.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
    });
    const queryParameterString = `?${queryParameters.join('&')}`;
    return queryParameterString;
}
