package com.ecapybara.carbonx.entity;

import java.util.Properties;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;

@Document("products")
@PersistentIndex(fields = {"name"})
public class Product {

  @ArangoId // db document field: _id
  private String arangoId;

  @Id // db document field: _key
  private String id;

  private String name; // e.g Tesla
  private String productNature; // e.g Car
  private String productOrigin; // e.g supplier/user
  private Properties functionalProperties;
  private Properties nonFunctionalProperties;
  private DigitalProductPassport DPP;

  // constructors
  public Product(final String productNature) {
    super();
    this.productNature = productNature;
  }

  public Product(final String productNature, final String name) {
    super();
    this.name = name;
    this.productNature = productNature;
  }

  public Product(final String productNature, final String name, final Properties functionalProperties, Properties nonFunctionalProperties) {
    super();
    this.name = name;
    this.productNature = productNature;
    this.functionalProperties = functionalProperties;
    this.nonFunctionalProperties = nonFunctionalProperties;
  }

  // getters & setters
  public String getArangoId() {
    return arangoId;
  }
  public void setArangoId(String arangoId) {
    this.arangoId = arangoId;
  }

  public String getId() {
    return id;
  }
  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }
  public void setName(String name) {
    this.name = name;
  }

  public String getProductNature() {
    return productNature;
  }
  public void setProductNature(String productNature) {
    this.productNature = productNature;
  }

  public String getProductOrigin() {
    return productOrigin;
  }
  public void setProductOrigin(String productOrigin) {
    this.productOrigin = productOrigin;
  }

  public Properties getFunctionalProperties() {
    return functionalProperties;
  }
  public void setFunctionalProperties(Properties functionalProperties) {
    this.functionalProperties = functionalProperties;
  }  

  public Properties getNonFunctionalProperties() {
    return nonFunctionalProperties;
  }
  public void setNonFunctionalProperties(Properties nonFunctionalProperties) {
    this.nonFunctionalProperties = nonFunctionalProperties;
  }

  public String getProperty(String propertyName) {
    if (functionalProperties.containsKey(propertyName)) {
      return functionalProperties.getProperty(propertyName);
    }
    else if (nonFunctionalProperties.containsKey(propertyName)) {
      return nonFunctionalProperties.getProperty(propertyName);
    }
    else {
      throw new NullPointerException("Property does not exist!");
    }
  }
  public void setProperty(String propertyName, String propertyValue) {
    if (functionalProperties.containsKey(propertyName)) {
      functionalProperties.setProperty(propertyName, propertyValue);
    }
    else if (nonFunctionalProperties.containsKey(propertyName)) {
      nonFunctionalProperties.setProperty(propertyName, propertyValue);
    }
    else {
      throw new NullPointerException("Property does not exist!");
    }
  }

  public DigitalProductPassport getDPP() {
    return DPP;
  }
  public void setDPP( DigitalProductPassport DPP) {
    this.DPP = DPP;
  }  
}
