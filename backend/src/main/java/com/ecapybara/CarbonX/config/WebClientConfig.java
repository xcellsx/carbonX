package com.ecapybara.carbonx.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

/**
 Web client configuration to so that the backend application can make HTTP requests to the ArangoDB Database
 **/

@Configuration
public class WebClientConfig {

    private final String DATABASE_API_URL = "http://localhost:8529/_db/testCompany/_api";
    @Value("${arangodb.spring.data.user}")
    private String username;
    @Value("${arangodb.spring.data.password}")
    private String password;

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .baseUrl(DATABASE_API_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeaders(headers -> headers.setBasicAuth(username, password))
                .build();
    }
}

