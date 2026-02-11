package com.ecapybara.carbonx.model.basic;

import com.opencsv.bean.CsvBindByName;

import lombok.Data;
import lombok.NonNull;
import lombok.experimental.SuperBuilder;

@Data @SuperBuilder(toBuilder = true)
public class DetailedChart {
  @NonNull
  @CsvBindByName(column = "emissionInformation.description")
  private String description;

  public DetailedChart(String description) {
    this.description = description;
  }
}
