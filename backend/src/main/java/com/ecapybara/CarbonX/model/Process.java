package com.ecapybara.carbonx.model;

import java.util.List;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;

public class Process {
  @Id // db document field: _key
  private String id;

  @ArangoId // db document field: _id
  private String arangoId;

  private String name;
  private String processType;
  private List<Product> inputs;
  private List<Product> outputs;


  // constructors
  public Process(String name) {
    this.name = name;
  }

  public Process(String name, String processType) {
    this.name = name;
    this.processType = processType;
  }

  // setters and getters
  public String getId() {return id;}
  public void setId(String id) {this.id = id;}
  public String getArangoId() {return arangoId;}
  public void setArangoId(String arangoId) {this.arangoId = arangoId;}
  public String getName() {return name;}
  public void setName(String name) {this.name = name;}
  public String getProcessType() {return processType;}
  public void setProcessType(String processType) {this.processType = processType;}
  public List<Product> getInputs() {return inputs;}
  public void setInputs(List<Product> inputs) {this.inputs = inputs;}
  public List<Product> getOutputs() {return outputs;}
  public void setOutputs(List<Product> outputs) {this.outputs = outputs;}
  
}
