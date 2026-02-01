package com.ecapybara.carbonx.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

    // Add error, warn similarly
}
