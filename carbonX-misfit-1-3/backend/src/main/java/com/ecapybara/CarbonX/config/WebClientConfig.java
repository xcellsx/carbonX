package com.ecapybara.CarbonX.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.netty.http.client.HttpClient;
import java.time.Duration;

/**
 * Web client configuration for making HTTP requests to the ArangoDB Database.
 * Supports configurable host, port, and database settings.
 */
@Configuration
public class WebClientConfig {

    @Value("${arangodb.spring.data.hosts:localhost:8529}")
    private String hosts;

    @Value("${arangodb.spring.data.database:testCompany}")
    private String database;

    @Value("${arangodb.spring.data.user:root}")
    private String username;

    @Value("${arangodb.spring.data.password:}")
    private String password;

    @Value("${arangodb.webclient.timeout:30}")
    private int timeoutSeconds;

    @Value("${arangodb.webclient.max-memory-size:16777216}")
    private int maxInMemorySize; // 16MB default

    /**
     * Primary WebClient for database-specific API calls.
     * Base URL: http://{host}:{port}/_db/{database}/_api
     */
    @Bean
    public WebClient webClient() {
        String baseUrl = buildDatabaseApiUrl();
        
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(timeoutSeconds));

        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(maxInMemorySize))
                .build();

        return WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .exchangeStrategies(strategies)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeaders(headers -> headers.setBasicAuth(username, password))
                .build();
    }

    /**
     * System-level WebClient for admin operations that don't require a database context.
     * Base URL: http://{host}:{port}
     */
    @Bean(name = "systemWebClient")
    public WebClient systemWebClient() {
        String baseUrl = buildSystemUrl();
        
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(timeoutSeconds));

        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(maxInMemorySize))
                .build();

        return WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .exchangeStrategies(strategies)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeaders(headers -> headers.setBasicAuth(username, password))
                .build();
    }

    /**
     * Build the database-specific API URL.
     */
    private String buildDatabaseApiUrl() {
        String host = getHost();
        int port = getPort();
        return String.format("http://%s:%d/_db/%s/_api", host, port, database);
    }

    /**
     * Build the system-level URL (no database context).
     */
    private String buildSystemUrl() {
        String host = getHost();
        int port = getPort();
        return String.format("http://%s:%d", host, port);
    }

    /**
     * Extract host from the hosts configuration string.
     */
    private String getHost() {
        if (hosts != null && hosts.contains(":")) {
            return hosts.split(":")[0];
        }
        return hosts != null ? hosts : "localhost";
    }

    /**
     * Extract port from the hosts configuration string.
     */
    private int getPort() {
        if (hosts != null && hosts.contains(":")) {
            try {
                return Integer.parseInt(hosts.split(":")[1]);
            } catch (NumberFormatException e) {
                return 8529;
            }
        }
        return 8529;
    }

    /**
     * Get the configured database name.
     */
    public String getDatabase() {
        return database;
    }

    /**
     * Get the ArangoDB base URL.
     */
    public String getArangoBaseUrl() {
        return buildSystemUrl();
    }
}

