package com.ecapybara.carbonx.service.exception;

import lombok.Getter;

/**
 * Exception thrown when database operations fail
 */
@Getter
public class DatabaseOperationException extends RuntimeException {
    private final String operation;

    public DatabaseOperationException(String operation, String message) {
        super(String.format("Database %s operation failed: %s", operation, message));
        this.operation = operation;
    }

    public DatabaseOperationException(String operation, String message, Throwable cause) {
        super(String.format("Database %s operation failed: %s", operation, message), cause);
        this.operation = operation;
    }
}
