package com.ecapybara.carbonx.utils.csv;

import com.ecapybara.carbonx.ApplicationContextHolder;
import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.repository.ProductRepository;
import com.opencsv.bean.AbstractBeanField;

public class IdToProductConverter extends AbstractBeanField<Product, String> {

  private ProductRepository productRepository;

  public IdToProductConverter() {
    super();
  }

  private synchronized ProductRepository getProductRepository() {
    if (productRepository == null) {
      try {
        productRepository = ApplicationContextHolder.getBean(ProductRepository.class);
      } catch (Exception e) {
        System.err.println("Failed to initialize ProductRepository: " + e.getMessage());
      }
    }
    return productRepository;
  }

  @Override
  protected Product convert(String value) {
    ProductRepository repo = getProductRepository();
    return repo.findById(value).orElse(null);
  }
}
