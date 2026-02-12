package com.ecapybara.carbonx.model.ipcc;

import com.ecapybara.carbonx.model.basic.Metric;
import com.opencsv.bean.CsvRecurse;

import lombok.Data;

@Data
public class EmissionChart {
  @CsvRecurse
  private Metric CO2;

  @CsvRecurse
  private Metric CH4;

  @CsvRecurse
  private Metric N2O;

  @CsvRecurse
  private Metric SF6;

  @CsvRecurse
  private HydrofluorocarbonChart HFCs;

  @CsvRecurse
  private PerfluorocarbonChart PFCs;

  @CsvRecurse
  private Metric NF3;

  @CsvRecurse
  private Metric H20;

  @CsvRecurse
  private Metric O3;

  @CsvRecurse
  private ChlorofluorocarbonChart CFCs;
}
