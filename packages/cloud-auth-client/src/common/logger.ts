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
