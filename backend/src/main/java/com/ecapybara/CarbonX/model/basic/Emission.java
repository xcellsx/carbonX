package com.ecapybara.carbonx.model.basic;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.processor.ConvertEmptyOrBlankStringsToNull;
import com.opencsv.bean.processor.PreAssignmentProcessor;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class Emission {
  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  private String name; // eg. "CO"

  private Metric metric; // eg. 22.5
}
