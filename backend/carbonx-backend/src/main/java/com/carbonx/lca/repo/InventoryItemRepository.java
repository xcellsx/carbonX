package com.carbonx.lca.repo;

import com.carbonx.lca.domain.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    /**
     * Checks if an inventory item exists for a given product ID.
     * @param productId The ID of the Product.
     * @return true if an item exists, false otherwise.
     */
    boolean existsByProductId(Long productId);

    /**
     * Finds inventory items where the associated product's name contains the given string (case-insensitive).
     * Spring Data JPA generates the query based on the method name convention (_ denotes traversal).
     * @param productName The search string for the product name.
     * @return A list of matching InventoryItems.
     */
    List<InventoryItem> findByProduct_NameContainingIgnoreCase(String productName); // Corrected method name

}

