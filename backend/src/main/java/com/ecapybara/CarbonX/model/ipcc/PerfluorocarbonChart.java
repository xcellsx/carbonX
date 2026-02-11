package com.ecapybara.carbonx.model.ipcc;

import com.ecapybara.carbonx.model.basic.Emission;
import com.opencsv.bean.CsvRecurse;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class PerfluorocarbonChart{
  @CsvRecurse
  private Emission PFC_14;

  @CsvRecurse
  private Emission PFC_116;

  @CsvRecurse
  private Emission PFC_218;
}
