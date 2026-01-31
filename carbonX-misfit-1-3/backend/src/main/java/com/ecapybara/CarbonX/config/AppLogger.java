package com.ecapybara.CarbonX.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Legacy logging utility class - kept for backward compatibility.
 * 
 * RECOMMENDED APPROACH:
 * For new code, use Lombok's @Slf4j annotation instead:
 * 
 * @Slf4j
 * @RestController
 * public class MyController {
 *     public void myMethod() {
 *         log.info("Message here");
 *         log.error("Error occurred", exception);
 *     }
 * }
 * 
 * This provides a 'log' field automatically without needing static methods.
 */
public class AppLogger {
    public static Logger getLogger(Class<?> clazz) {
        return LoggerFactory.getLogger(clazz);
    }

    public static void info(Class<?> clazz, String message, Object... args) {
        Logger logger = getLogger(clazz);
        logger.info(message, args);
    }

    public static void debug(Class<?> clazz, String message, Object... args) {
        Logger logger = getLogger(clazz);
        logger.debug(message, args);
    }

    public static void warn(Class<?> clazz, String message, Object... args) {
        Logger logger = getLogger(clazz);
        logger.warn(message, args);
    }

    public static void error(Class<?> clazz, String message, Object... args) {
        Logger logger = getLogger(clazz);
        logger.error(message, args);
    }

    public static void error(Class<?> clazz, String message, Throwable throwable) {
        Logger logger = getLogger(clazz);
        logger.error(message, throwable);
    }
}
