package com.ecapybara.carbonx.model.ipcc;

import java.util.Map;

import com.opencsv.bean.CsvRecurse;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class ChlorofluorocarbonChart{
  @CsvRecurse
  private Map<String,Object> CFC_11;

  @CsvRecurse
  private Map<String,Object> CFC_12;

  @CsvRecurse
  private Map<String,Object> CFC_13;

  @CsvRecurse
  private Map<String,Object> CFC_113;

  @CsvRecurse
  private Map<String,Object> CFC_114;

  @CsvRecurse
  private Map<String,Object> CFC_115;
}
