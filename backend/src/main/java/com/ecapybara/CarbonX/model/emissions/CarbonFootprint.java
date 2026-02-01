package com.ecapybara.carbonx.model.emissions;

import java.util.Map;

import com.ecapybara.carbonx.model.Metric;

public class CarbonFootprint {
  private Metric Scope1;
  private Metric Scope2;
  private Map<String,Metric> Scope3; //eg. {"Category 1": metricObject, "Category 2": metricObject}

  // constructors
  public CarbonFootprint() {
    super();
  }

  // getters & setters
  public Metric getScope1() {
    return Scope1;
  }

  public void setScope1(Metric scope1) {
    this.Scope1 = scope1;
  }

  public Metric getScope2() {
    return Scope2;
  }

  public void setScope2(Metric scope2) {
    this.Scope2 = scope2;
  }

  public Map<String, Metric> getScope3() {
    return Scope3;
  }

  public void setScope3(Map<String, Metric> scope3) {
    this.Scope3 = scope3;
  }
}
