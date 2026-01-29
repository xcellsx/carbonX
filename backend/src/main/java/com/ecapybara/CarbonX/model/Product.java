package com.ecapybara.carbonx.model;

import java.util.Collection;

import org.springframework.data.annotation.PersistenceCreator;

import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.arangodb.springframework.annotation.Relations;

@Document("products")
@PersistentIndex(fields = {"id", "key","name","type","productOrigin","userId"})
public class Product extends Node {
  
  private String productOrigin; // e.g supplier/user

  @Relations(edges = Output.class, lazy=true)
  private Collection<Process> procedure;
  /* 
  @Relations(edges = Input.class, lazy=true)
  private Collection<Process> usedIn;
  */
  
  // Additional fields for inventory management
  private String userId; // User who owns this product
  private String uploadedFile; // Filename of uploaded BOM file

  // constructors
  public Product() {
    super();
  }

  public Product(final String type) {
    super(type);
  }
  
  @PersistenceCreator
  public Product(final String type, final String name) {
    super(type, name);
  }

  // getters & setters
  public String getProductOrigin() { return productOrigin;}
  public void setProductOrigin(String productOrigin) { this.productOrigin = productOrigin; }
  public Collection<Process> getProcedure() { return procedure; }
  public void serProcedure(Collection<Process> procedure)  {this.procedure = procedure; }
  
  // Getters and setters for inventory fields
  public String getUserId() {return userId;}
  public void setUserId(String userId) {this.userId = userId;}  
  public String getUploadedFile() {return uploadedFile;}
  public void setUploadedFile(String uploadedFile) {this.uploadedFile = uploadedFile;}
}
