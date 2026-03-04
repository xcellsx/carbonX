package com.ecapybara.carbonx.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.ecapybara.carbonx.model.UserProductLca;
import com.ecapybara.carbonx.repository.UserProductLcaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserProductLcaService {

  private final UserProductLcaRepository repository;

  /** Arango _key cannot contain '/'; normalize "users/421" -> "421". */
  private static String normalizeUserIdKey(String userId) {
    if (userId == null || userId.isEmpty()) return userId;
    String s = userId.trim();
    if (s.startsWith("users/")) s = s.substring(6);
    int slash = s.indexOf('/');
    if (slash >= 0) s = s.substring(0, slash);
    return s.isEmpty() ? userId : s;
  }

  /**
   * Save or update LCA value for a user+product. Key = userId_productKey (key-safe, no slashes).
   */
  public UserProductLca upsert(String userId, String productKey, Double lcaValue) {
    if (userId == null || productKey == null || lcaValue == null) {
      log.warn("UserProductLca upsert skipped: userId/productKey/lcaValue null");
      return null;
    }
    userId = normalizeUserIdKey(userId);
    productKey = productKey.contains("/") ? productKey.substring(productKey.lastIndexOf('/') + 1) : productKey;
    String key = UserProductLca.toKey(userId, productKey);
    if (key == null || key.contains("/")) {
      log.warn("UserProductLca upsert skipped: illegal key would be {}", key);
      return null;
    }
    UserProductLca doc = repository.findById(key).orElse(UserProductLca.builder()
        .key(key)
        .userId(userId)
        .productKey(productKey)
        .build());
    doc.setLcaValue(lcaValue);
    doc.setUpdatedAt(System.currentTimeMillis());
    UserProductLca saved = repository.save(doc);
    log.info("Saved user_product_lca: userId={}, productKey={}, lcaValue={}", userId, productKey, lcaValue);
    return saved;
  }

  /**
   * Get all LCA entries for a user. Returns map productKey -> lcaValue for easy lookup.
   * Returns empty map if collection is missing or query fails (so frontend always gets 200).
   */
  public Map<String, Double> getLcaMapByUserId(String userId) {
    Map<String, Double> map = new HashMap<>();
    if (userId == null || userId.isEmpty()) return map;
    userId = normalizeUserIdKey(userId);
    try {
      List<UserProductLca> list = repository.findByUserId(userId);
      for (UserProductLca e : list) {
        if (e.getProductKey() != null && e.getLcaValue() != null) {
          map.put(e.getProductKey(), e.getLcaValue());
        }
      }
    } catch (Exception e) {
      log.warn("getLcaMapByUserId failed for userId={}: {}", userId, e.getMessage());
    }
    return map;
  }
}
