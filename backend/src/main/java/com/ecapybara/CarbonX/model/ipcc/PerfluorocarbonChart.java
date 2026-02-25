package com.ecapybara.carbonx.model.ipcc;

import java.util.Map;

import com.opencsv.bean.CsvRecurse;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class PerfluorocarbonChart{
  @CsvRecurse
  private Map<String,Object> PFC_14;

  @CsvRecurse
  private Map<String,Object> PFC_116;

  @CsvRecurse
  private Map<String,Object> PFC_218;
}
