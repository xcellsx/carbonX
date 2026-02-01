package com.ecapybara.carbonx.model.emissions;

import com.ecapybara.carbonx.model.Metric;

public class Emission {
  private String name; // eg. "CO"
  private Metric metric; // eg. 22.5

  // constructors
  public Emission() {
    super();
  }
  public Emission(String name, Metric metric, String unit) {
    super();
    this.name = name;
    this.metric = metric;
  }

  // getters and setters
  public String getName() {
    return name;
  }
  public void setName(String name) {
    this.name = name;
  }
  public Metric getMetric() {
    return metric;
  }
  public void setMetric(Metric metric) {
    this.metric = metric;
  }
}
