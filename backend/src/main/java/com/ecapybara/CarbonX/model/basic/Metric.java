package com.ecapybara.carbonx.model.basic;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.processor.ConvertEmptyOrBlankStringsToNull;
import com.opencsv.bean.processor.PreAssignmentProcessor;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class Metric {
  @CsvBindByName
  private Double value;

  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  private String unit;
}
