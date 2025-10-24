package com.carbonx.lca.web;

import com.carbonx.lca.domain.Product;
import com.carbonx.lca.dto.ProductInventoryDTO;
import com.carbonx.lca.repo.ProductRepository;
import com.carbonx.lca.service.JsonRpcClient;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductSearchService {

    private final JsonRpcClient olcaClient;
    private final ProductRepository productRepository;

    public ProductSearchService(JsonRpcClient olcaClient, ProductRepository productRepository) {
        this.olcaClient = olcaClient;
        this.productRepository = productRepository;
    }

    public List<ProductInventoryDTO> searchProducts(String query) throws IOException {
        List<Map<String, Object>> processes = olcaClient.call(
            "find",
            Map.of("type", "Process", "query", query),
            new TypeReference<List<Map<String, Object>>>() {}
        );

        return processes.stream()
            .map(p -> new ProductInventoryDTO((String) p.get("name"), (String) p.get("@id")))
            .collect(Collectors.toList());
    }

    public Product addProductFromInventory(String name) {
        Optional<Product> existingProduct = productRepository.findByName(name);
        if (existingProduct.isPresent()) {
            return existingProduct.get();
        }
        Product newProduct = new Product();
        newProduct.setName(name);
        return productRepository.save(newProduct);
    }
}