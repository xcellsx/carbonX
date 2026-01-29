package com.ecapybara.carbonx.model;

import org.springframework.data.annotation.PersistenceCreator;

import com.arangodb.springframework.annotation.Edge;
import com.arangodb.springframework.annotation.From;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.arangodb.springframework.annotation.To;
import com.fasterxml.jackson.annotation.JsonAlias;

@Edge("inputs")
@PersistentIndex(fields = {"id","key","productName","processName"})
public class Input extends com.ecapybara.carbonx.model.Edge {  
  @From
  @JsonAlias({"_from"})
  private Product product;
  private String productName;

  @To
  @JsonAlias({"_to"})
  private Process process;
  private String processName;

  public Input() {
    super();
  }

  @PersistenceCreator
  public Input(final Product product, final Process process) {
    super();
    this.product = product;
    this.productName = product.getName();
    this.process = process;
    this.processName = process.getName();
  }
  
  @Override
  public String toString() {
    return "Input [id=" + this.getId() + ", product=" + productName + ", process=" + processName + "]";
  }

  // setter and getter
  public Product getProduct() { return product; }
  public String getProductName() { return productName; }
  public void setProduct(Product product) { 
    this.product = product;
    this.productName = product.getName();
  }
  public Process getProcess() { return process; }
  public String getProcessName() { return processName; }
  public void setProcess(Process process) { 
    this.process = process;
    this.processName = process.getName();
  }
}
