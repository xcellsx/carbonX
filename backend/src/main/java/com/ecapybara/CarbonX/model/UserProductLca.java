package com.ecapybara.carbonx.model;

import com.arangodb.springframework.annotation.Document;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.Id;

/**
 * Stores LCA (total kgCO2e) per user and product.
 * One document per user+product; key = userId + "_" + productKey.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document("user_product_lca")
public class UserProductLca {

  @Id
  private String key;  // userId_productKey (Arango _key)

  private String userId;
  private String productKey;

  @JsonProperty("lcaValue")
  private Double lcaValue;

  private Long updatedAt;

  /** Build document key for a user+product. */
  public static String toKey(String userId, String productKey) {
    if (userId == null || productKey == null) return null;
    return userId + "_" + productKey;
  }
}
