package com.ecapybara.carbonx.model;

import java.util.List;
import java.util.Map;

public class Graph {

  private String name;
  private List<EdgeDefinition> edgeDefinitions;
  private Boolean isDisjoint = false;
  private Boolean isSmart = false;
  private List<String> orphanCollections;
  private Map<String,Object> options;

  public Graph(String name, List<EdgeDefinition> edgeDefinitions) {
    super();
    this.name = name;
    this.edgeDefinitions = edgeDefinitions;
  }

  public String getName() {
    return name;
  }
  public void setName(String name) {
    this.name = name;
  }
  public List<EdgeDefinition> getEdgeDefinitions() {
    return edgeDefinitions;
  }
  public void setEdgeDefinitions(List<EdgeDefinition> edgeDefinitions) {
    this.edgeDefinitions = edgeDefinitions;
  }
  public Boolean getIsDisjoint() {
    return isDisjoint;
  }
  public void setIsDisjoint(Boolean isDisjoint) {
    this.isDisjoint = isDisjoint;
  }
  public Boolean getIsSmart() {
    return isSmart;
  }
  public void setIsSmart(Boolean isSmart) {
    this.isSmart = isSmart;
  }
  public List<String> getOrphanCollections() {
    return orphanCollections;
  }
  public void setOrphanCollections(List<String> orphanCollections) {
    this.orphanCollections = orphanCollections;
  }
  public Map<String, Object> getOptions() {
    return options;
  }
  public void setOptions(Map<String, Object> options) {
    this.options = options;
  }
}
