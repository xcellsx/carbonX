package com.carbonx.lca.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class JsonRpcClient {

    private final String serverUrl;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicLong requestId = new AtomicLong(1);

    public JsonRpcClient(@Value("${olca.ipcBaseUrl}") String serverUrl) {
        this.serverUrl = serverUrl;
    }

    public <T> T call(String method, Map<String, Object> params, TypeReference<T> responseType) throws IOException {
        long id = requestId.getAndIncrement();
        Map<String, Object> requestPayload = new HashMap<>();
        requestPayload.put("jsonrpc", "2.0");
        requestPayload.put("id", id);
        requestPayload.put("method", method);
        requestPayload.put("params", params);

        URL url = new URL(this.serverUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/json; utf-8");
        connection.setRequestProperty("Accept", "application/json");
        connection.setDoOutput(true);

        try (OutputStream os = connection.getOutputStream()) {
            byte[] input = objectMapper.writeValueAsBytes(requestPayload);
            os.write(input, 0, input.length);
        }

        int responseCode = connection.getResponseCode();
        if (responseCode != HttpURLConnection.HTTP_OK) {
            throw new IOException("HTTP POST request failed with error code: " + responseCode);
        }

        Map<String, Object> response = objectMapper.readValue(connection.getInputStream(), new TypeReference<>() {});
        if (response.containsKey("error")) {
            throw new IOException("JSON-RPC error: " + response.get("error").toString());
        }

        return objectMapper.convertValue(response.get("result"), responseType);
    }
}