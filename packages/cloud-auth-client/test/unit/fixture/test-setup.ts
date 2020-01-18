// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockWindowProperty = (property: any, value: any): void => {
    const { [property]: originalProperty } = window;
    delete window[property];
    beforeAll(() => {
        Object.defineProperty(window, property, {
            configurable: true,
            writable: true,
            value,
        });
    });
    afterAll(() => {
        window[property] = originalProperty;
    });
};
