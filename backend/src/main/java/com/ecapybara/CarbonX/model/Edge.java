package com.ecapybara.carbonx.model;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.fasterxml.jackson.annotation.JsonAlias;

public class Edge {
  @ArangoId // db document field: _id
  @JsonAlias({"_id"})
  private String id;

  @Id // db document field: _key
  @JsonAlias({"_key"})
  private String key;

  // constructors
  public Edge() {
    super();
  }

  // setters and getters
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getKey() { return key; }
  public void setKey(String key) { this.key = key; }
}
