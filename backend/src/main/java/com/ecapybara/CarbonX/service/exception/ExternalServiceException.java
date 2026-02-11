package com.ecapybara.carbonx.service.exception;

import lombok.Getter;

/**
 * Exception thrown when external service (like ArangoDB) fails
 */
@Getter
public class ExternalServiceException extends RuntimeException {
    private final String serviceName;
    private final int statusCode;

    public ExternalServiceException(String serviceName, String message) {
        super(String.format("%s service error: %s", serviceName, message));
        this.serviceName = serviceName;
        this.statusCode = 0;
    }

    public ExternalServiceException(String serviceName, int statusCode, String message) {
        super(String.format("%s service error (status %d): %s", serviceName, statusCode, message));
        this.serviceName = serviceName;
        this.statusCode = statusCode;
    }

    public ExternalServiceException(String serviceName, String message, Throwable cause) {
        super(String.format("%s service error: %s", serviceName, message), cause);
        this.serviceName = serviceName;
        this.statusCode = 0;
    }
}
