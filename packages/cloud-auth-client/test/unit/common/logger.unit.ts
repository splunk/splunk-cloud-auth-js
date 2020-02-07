import { Logger } from '../../../src/common/logger';
import { mockWindowProperty } from '../fixture/test-setup';

const CONSOLE_LOG_IDENTIFIER = 'splunk-cloud-auth-client'
const LOG_MESSAGE = 'i am a log message';

describe('Logger', () => {
    describe('error', () => {
        describe('when console exists', () => {
            const consoleMock = {
                error: jest.fn()
            };
            mockWindowProperty('console', consoleMock);

            it('logs to console', () => {
                // Act
                Logger.error(LOG_MESSAGE);

                // Assert
                expect(consoleMock.error).toBeCalledWith(`[${CONSOLE_LOG_IDENTIFIER}] ERROR: ${LOG_MESSAGE}`);
            });
        });
    });

    describe('log', () => {
        describe('when console exists', () => {
            const consoleMock = {
                log: jest.fn()
            };
            mockWindowProperty('console', consoleMock);

            it('logs to console', () => {
                // Act
                Logger.log(LOG_MESSAGE);

                // Assert
                expect(consoleMock.log).toBeCalledWith(`[${CONSOLE_LOG_IDENTIFIER}] LOG: ${LOG_MESSAGE}`);
            });
        });
    });

    describe('warn', () => {
        describe('when console exists', () => {
            const consoleMock = {
                warn: jest.fn()
            };
            mockWindowProperty('console', consoleMock);

            it('logs to console', () => {
                // Act
                Logger.warn(LOG_MESSAGE);

                // Assert
                expect(consoleMock.warn).toBeCalledWith(`[${CONSOLE_LOG_IDENTIFIER}] WARN: ${LOG_MESSAGE}`);
            });
        });
    });
});
