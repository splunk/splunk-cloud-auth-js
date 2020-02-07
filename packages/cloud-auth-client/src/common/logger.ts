/*
Copyright © 2019 Splunk Inc.
SPLUNK CONFIDENTIAL – Use or disclosure of this material in whole or in part
without a valid written license from Splunk Inc. is PROHIBITED.
*/

const CONSOLE_LOG_IDENTIFIER = 'splunk-cloud-auth-client';
const ERROR_PREFIX = 'ERROR';
const LOG_PREFIX = 'LOG';
const WARN_PREFIX = 'WARN';

/**
 * Logger class.
 */
export class Logger {
    /**
     * Logs an error message to console.
     * @param message Message.
     */
    public static error(message: string) {
        const consoleLogger = typeof window !== 'undefined' && window.console;
        if (consoleLogger && consoleLogger.error) {
            consoleLogger.error(`[${CONSOLE_LOG_IDENTIFIER}] ${ERROR_PREFIX}: ${message}`);
        }
    }

    /**
     * Logs a message to console.
     * @param message Message.
     */
    public static log(message: string) {
        const consoleLogger = typeof window !== 'undefined' && window.console;
        if (consoleLogger && consoleLogger.log) {
            consoleLogger.log(`[${CONSOLE_LOG_IDENTIFIER}] ${LOG_PREFIX}: ${message}`);
        }
    }

    /**
     * Logs a warning message to console.
     * @param message Message.
     */
    public static warn(message: string) {
        const consoleLogger = typeof window !== 'undefined' && window.console;
        if (consoleLogger && consoleLogger.warn) {
            consoleLogger.warn(`[${CONSOLE_LOG_IDENTIFIER}] ${WARN_PREFIX}: ${message}`);
        }
    }
}
