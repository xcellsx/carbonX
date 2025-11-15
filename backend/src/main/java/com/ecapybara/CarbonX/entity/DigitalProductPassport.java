package com.ecapybara.carbonx.entity;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;

@Document("products")
@PersistentIndex(fields = {"name"})
public class DigitalProductPassport {

  @ArangoId // db document field: _id
  private String arangoId;

  @Id // db document field: _key
  private String id;

  private String component;
  private String process;
  private double weight;


  //constructor
  public DigitalProductPassport() {
    super();
  }

  public DigitalProductPassport(String component, String process, double weight) {
    super();
    this.component = component;
    this.process = process;
    this.weight = weight;
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
  public String getComponent() {
      return component;
  }
  public void setComponent(String component) {
      this.component = component;
  }
  
  public String getProcess() {
    return process;
  }
  public void setProcess(String process) {
    this.process = process;
  }
  public double getWeight() {
    return weight;
  }
  public void setWeight(double weight) {
    this.weight = weight;
  }

  
}