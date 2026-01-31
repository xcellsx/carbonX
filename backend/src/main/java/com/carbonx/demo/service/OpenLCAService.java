// xcellsx/carbonx/carbonX-cells/backend/src/main/java/com/carbonx/demo/service/OpenLCAService.java
package com.carbonx.demo.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.carbonx.demo.model.Product;
import com.carbonx.demo.repository.ProductRepository;

@Service
public class OpenLCAService {

    @Autowired
    private ProductRepository productRepo;
    
    private static final String OPENLCA_RPC_ENDPOINT = "http://localhost:8080/";

    // Fetch all OpenLCA processes and store in Product table
    public int syncProcessesFromOpenLCA() {
        RestTemplate restTemplate = new RestTemplate();
        List<Map<String, Object>> processList;

        try {
            // Step 1: Build the JSON-RPC request payload
            Map<String, Object> params = new HashMap<>();
            params.put("@type", "Process");

            Map<String, Object> payload = new HashMap<>();
            payload.put("jsonrpc", "2.0");
            payload.put("method", "data/get/descriptors");
            payload.put("params", params);
            payload.put("id", 1);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            // Step 2: POST the request to the root endpoint
ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, request, (Class<Map<String, Object>>)(Class<?>)Map.class);
            Map<String, Object> body = response.getBody();

            if (body == null || body.get("error") != null) {
                throw new RuntimeException("OpenLCA JSON-RPC error: " + body.get("error"));
            }

            // Step 3: Extract the "result" from the JSON-RPC response
            processList = (List<Map<String, Object>>) body.get("result");

        } catch (RestClientException e) {
            System.err.println("!!! FAILED TO CONNECT TO OPENLCA SERVER !!!");
            System.err.println("OpenLCA sync failed: " + e.getMessage());
            throw new RuntimeException("LCA sync failed, check backend logs for details.", e);
        } catch (Exception e) {
            System.err.println("!!! FAILED TO PARSE OPENLCA RESPONSE !!!");
            System.err.println("Error: " + e.getMessage());
            throw new RuntimeException("LCA sync failed, check backend logs for details.", e);
        }

        // Step 4: Save the processes to the database
        int count = 0;
        for (Map<String, Object> process : processList) {
            String uuid = (String) process.get("@id"); // Note: JSON-RPC uses "@id"
            String name = (String) process.get("name");
            // --- MODIFICATION: Get location ---
            String location = (String) process.get("location");
            
            if (uuid == null || name == null) {
                System.err.println("Skipping process with missing id or name: " + process);
                continue;
            }

            if (productRepo.existsById(uuid)) continue;
            
            Product prod = new Product();
            prod.setOpenLcaProcessId(uuid);
            prod.setName(name);
            // --- MODIFICATION: Set location ---
            prod.setLocation(location);
            
            productRepo.save(prod);
            count++;
        }
        System.out.println("Successfully synced " + count + " new processes from OpenLCA via JSON-RPC.");
        return count;
    }
}