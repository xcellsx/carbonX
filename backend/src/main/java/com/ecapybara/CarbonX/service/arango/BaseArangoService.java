package com.ecapybara.carbonx.service.arango;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.ecapybara.carbonx.service.exception.ExternalServiceException;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * Base service class providing common ArangoDB REST API operations.
 * All ArangoDB service classes should extend this class.
 */
@Slf4j
public abstract class BaseArangoService {

    @Autowired
    protected WebClient webClient;

    @Value("${arangodb.spring.data.database:testCompany}")
    protected String defaultDatabase;

    protected static final String ARANGO_BASE_URL = "http://localhost:8529";

    /**
     * Execute a GET request to ArangoDB
     */
    protected <T> Mono<T> get(String uri, Class<T> responseType) {
        return webClient.get()
                .uri(uri)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> handleErrorResponse(response, "GET", uri))
                .bodyToMono(responseType)
                .doOnError(error -> logError("GET", uri, error));
    }

    /**
     * Execute a GET request with path variables
     */
    protected <T> Mono<T> get(String uri, Class<T> responseType, Object... uriVariables) {
        return webClient.get()
                .uri(uri, uriVariables)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> handleErrorResponse(response, "GET", uri))
                .bodyToMono(responseType)
                .doOnError(error -> logError("GET", uri, error));
    }

    /**
     * Execute a POST request to ArangoDB
     */
    protected <T> Mono<T> post(String uri, Object body, Class<T> responseType) {
        return webClient.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> handleErrorResponse(response, "POST", uri))
                .bodyToMono(responseType)
                .doOnError(error -> logError("POST", uri, error));
    }

    /**
     * Execute a POST request with path variables
     */
    protected <T> Mono<T> post(String uri, Object body, Class<T> responseType, Object... uriVariables) {
        return webClient.post()
                .uri(uri, uriVariables)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> handleErrorResponse(response, "POST", uri))
                .bodyToMono(responseType)
                .doOnError(error -> logError("POST", uri, error));
    }

    /**
     * Execute a PUT request to ArangoDB
     */
    protected <T> Mono<T> put(String uri, Object body, Class<T> responseType) {
        return webClient.put()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> handleErrorResponse(response, "PUT", uri))
                .bodyToMono(responseType)
                .doOnError(error -> logError("PUT", uri, error));
    }

    /**
     * Execute a PUT request with path variables
     */
    protected <T> Mono<T> put(String uri, Object body, Class<T> responseType, Object... uriVariables) {
        return webClient.put()
                .uri(uri, uriVariables)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> handleErrorResponse(response, "PUT", uri))
                .bodyToMono(responseType)
                .doOnError(error -> logError("PUT", uri, error));
    }

    /**
     * Execute a PATCH request to ArangoDB
     */
    protected <T> Mono<T> patch(String uri, Object body, Class<T> responseType) {
        return webClient.patch()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> handleErrorResponse(response, "PATCH", uri))
                .bodyToMono(responseType)
                .doOnError(error -> logError("PATCH", uri, error));
    }

    /**
     * Execute a PATCH request with path variables
     */
    protected <T> Mono<T> patch(String uri, Object body, Class<T> responseType, Object... uriVariables) {
        return webClient.patch()
                .uri(uri, uriVariables)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> handleErrorResponse(response, "PATCH", uri))
                .bodyToMono(responseType)
                .doOnError(error -> logError("PATCH", uri, error));
    }

    /**
     * Execute a DELETE request to ArangoDB
     */
    protected <T> Mono<T> delete(String uri, Class<T> responseType) {
        return webClient.delete()
                .uri(uri)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> handleErrorResponse(response, "DELETE", uri))
                .bodyToMono(responseType)
                .doOnError(error -> logError("DELETE", uri, error));
    }

    /**
     * Execute a DELETE request with path variables
     */
    protected <T> Mono<T> delete(String uri, Class<T> responseType, Object... uriVariables) {
        return webClient.delete()
                .uri(uri, uriVariables)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> handleErrorResponse(response, "DELETE", uri))
                .bodyToMono(responseType)
                .doOnError(error -> logError("DELETE", uri, error));
    }

    /**
     * Handle error responses from ArangoDB
     */
    private Mono<Throwable> handleErrorResponse(org.springframework.web.reactive.function.client.ClientResponse response, 
                                                  String method, String uri) {
        log.error("ArangoDB API error - method: {}, uri: {}, status: {}", method, uri, response.statusCode());
        return response.bodyToMono(String.class)
                .flatMap(body -> Mono.error(new ExternalServiceException(
                        "ArangoDB", response.statusCode().value(), body)));
    }

    /**
     * Log errors from WebClient operations
     */
    private void logError(String method, String uri, Throwable error) {
        if (error instanceof WebClientResponseException) {
            WebClientResponseException wcre = (WebClientResponseException) error;
            log.error("WebClient error - method: {}, uri: {}, status: {}, body: {}",
                    method, uri, wcre.getStatusCode(), wcre.getResponseBodyAsString(), error);
        } else {
            log.error("Error during {} {}: {}", method, uri, error.getMessage(), error);
        }
    }

    /**
     * Build URI for database-specific endpoints
     */
    protected String dbUri(String path) {
        return path;  // WebClient already has database in baseUrl
    }

    /**
     * Build URI for system-level endpoints (no database prefix)
     */
    protected String systemUri(String path) {
        return ARANGO_BASE_URL + path;
    }
}
