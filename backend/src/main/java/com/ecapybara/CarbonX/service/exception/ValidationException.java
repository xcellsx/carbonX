package com.ecapybara.carbonx.service.exception;

import lombok.Getter;

/**
 * Exception thrown when request validation fails
 */
@Getter
public class ValidationException extends RuntimeException {
    private final String field;

    public ValidationException(String message) {
        super(message);
        this.field = null;
    }

    public ValidationException(String field, String message) {
        super(message);
        this.field = field;
    }
}
