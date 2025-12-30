package com.ecapybara.carbonx.model;

import java.util.Properties;
import java.util.List;

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
  private DigitalProductPassport DPP;
  private List<Process> usedInProcessAsInput;
  private List<Process> usedInProcessAsOutput;
  
  // Additional fields for inventory management
  private String userId; // User who owns this product
  private String uploadedFile; // Filename of uploaded BOM file

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
  }

  // getters & setters
  public String getArangoId() {return arangoId;}
  public void setArangoId(String arangoId) {this.arangoId = arangoId;}
  public String getId() {return id;  }
  public void setId(String id) {this.id = id;}
  public String getName() {return name;}
  public void setName(String name) {this.name = name;}
  public String getProductNature() {return productNature;}
  public void setProductNature(String productNature) {this.productNature = productNature;}
  public String getProductOrigin() {return productOrigin;}
  public void setProductOrigin(String productOrigin) {this.productOrigin = productOrigin;}
  public Properties getFunctionalProperties() {return functionalProperties;}
  public void setFunctionalProperties(Properties functionalProperties) {this.functionalProperties = functionalProperties;}
  public DigitalProductPassport getDPP() {return DPP;}
  public void setDPP(DigitalProductPassport DPP) {this.DPP = DPP;}
  
  // Getters and setters for inventory fields
  public String getUserId() {return userId;}
  public void setUserId(String userId) {this.userId = userId;}  
  public String getUploadedFile() {return uploadedFile;}
  public void setUploadedFile(String uploadedFile) {this.uploadedFile = uploadedFile;}

  public List<Process> getUsedInProcessAsInput() {return usedInProcessAsInput;}
  public void setUsedInProcessAsInput(List<Process> usedInProcessAsInput) {this.usedInProcessAsInput = usedInProcessAsInput;}
  public List<Process> getUsedInProcessAsOutput() {return usedInProcessAsOutput;}
  public void setUsedInProcessAsOutput(List<Process> usedInProcessAsOutput) {this.usedInProcessAsOutput = usedInProcessAsOutput;}

  
}
