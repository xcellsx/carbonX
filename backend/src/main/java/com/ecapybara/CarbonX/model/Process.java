package com.ecapybara.carbonx.model;

import java.util.Collection;

import org.springframework.data.annotation.PersistenceCreator;

import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.arangodb.springframework.annotation.Relations;

@Document("processes")
@PersistentIndex(fields = {"id","key","name", "type", "serviceProvider"})
public class Process extends Node {

  private String serviceProvider;

  @Relations(edges = Input.class, lazy = true)
  private Collection<Product> inputs;

  // constructors
  public Process() {
    super();
  }

  public Process(String name) {
    super();
    this.setName(name);
  }

  @PersistenceCreator
  public Process(String type, String name) {
    super(type, name);
  }

  // setters and getters
  public String getServiceProvider() { return serviceProvider; }
  public void setServiceProvider(String serviceProvider) { this.serviceProvider = serviceProvider; }
  public Collection<Product> getInputs() { return inputs; }
  public void setInputs(Collection<Product> inputs) { this.inputs = inputs; }

  @Override
  public String toString() {
    return "Process [id= " + this.getId() + ", name= " + this.getName() + ", processType= " + this.getType() + "]";
  }
}
