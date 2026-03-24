package com.ecapybara.carbonx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class DatabaseService {

    @Autowired
    private WebClient webClient;

    public String getAllDatabases() {
        return webClient.mutate()
                .baseUrl("http://localhost:8529/_db/_system/_api") // override base URL
                .build()
                .get()
                .uri("/database")
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    public String createDatabase(String name) {
        String jsonDocument = String.format("""
        {
            "name": "%s"
        }
        """, name);

        return webClient
            .post()
            .uri("http://localhost:8529/_db/_system/_api/database")
            .bodyValue(jsonDocument)
            .retrieve()
            .bodyToMono(String.class)
            .block();
    }

    public String deleteDatabase(String name){
 
        return webClient
            .delete()
            .uri("http://localhost:8529/_db/_system/_api/database/{name}",name)
            .retrieve()
            .bodyToMono(String.class)
            .block();
    }

}
