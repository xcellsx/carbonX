package com.ecapybara.carbonx.model.basic;

import java.util.List;

// used to define and create graphs
public class EdgeDefinition {

  private String collection;
  private List<String> from;
  private List<String> to;

  public EdgeDefinition(String collection, List<String> from, List<String> to) {
    super();
    this.collection = collection;
    this.from = from;
    this.to = to;
  }

  // getters and setters
  public String getCollection() {
    return collection;
  }
  public void setCollection(String collection) {
    this.collection = collection;
  }
  public List<String> getFrom() {
    return from;
  }
  public void setFrom(List<String> from) {
    this.from = from;
  }
  public List<String> getTo() {
    return to;
  }
  public void setTo(List<String> to) {
    this.to = to;
  }
}
