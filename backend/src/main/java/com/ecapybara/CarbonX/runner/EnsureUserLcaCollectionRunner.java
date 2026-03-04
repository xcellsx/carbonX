package com.ecapybara.carbonx.runner;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

import com.ecapybara.carbonx.service.arango.ArangoCollectionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Ensures the user_product_lca collection exists so LCA persistence works
 * even when full InitialSetup (DB drop + import) is not run.
 */
@Slf4j
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
public class EnsureUserLcaCollectionRunner implements CommandLineRunner {

  private final ArangoCollectionService arangoCollectionService;

  @Override
  public void run(String... args) {
    try {
      arangoCollectionService.getCollection("user_product_lca").block();
      log.debug("user_product_lca collection already exists");
    } catch (Exception e) {
      try {
        arangoCollectionService.createCollection("user_product_lca", 2, null, null, null, null, null).block();
        log.info("user_product_lca collection created for LCA persistence");
      } catch (Exception ex) {
        log.warn("Could not create user_product_lca collection: {}", ex.getMessage());
      }
    }
  }
}
