package com.ecapybara.carbonx.controller;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.model.UserProductLca;
import com.ecapybara.carbonx.service.UserProductLcaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserLcaController {

  private final UserProductLcaService userProductLcaService;

  /**
   * Save LCA value for a product for the given user.
   * PUT /api/users/{userId}/lca/{productKey}  body: { "lcaValue": 29.09 }
   */
  @PutMapping(value = "/{userId}/lca/{productKey}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public UserProductLca saveUserProductLca(
      @PathVariable String userId,
      @PathVariable String productKey,
      @RequestBody Map<String, Double> body) {
    Double lcaValue = body != null ? body.get("lcaValue") : null;
    return userProductLcaService.upsert(userId, productKey, lcaValue);
  }

  /**
   * Get all LCA values for the user. Returns { "productKey": lcaValue, ... }.
   * GET /api/users/{userId}/lca
   */
  @GetMapping("/{userId}/lca")
  public Map<String, Double> getUserLcas(@PathVariable String userId) {
    return userProductLcaService.getLcaMapByUserId(userId);
  }
}
