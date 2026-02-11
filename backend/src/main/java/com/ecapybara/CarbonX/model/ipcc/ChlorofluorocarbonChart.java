package com.ecapybara.carbonx.model.ipcc;

import com.ecapybara.carbonx.model.basic.Emission;
import com.opencsv.bean.CsvRecurse;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class ChlorofluorocarbonChart{
  @CsvRecurse
  private Emission CFC_11;

  @CsvRecurse
  private Emission CFC_12;

  @CsvRecurse
  private Emission CFC_13;

  @CsvRecurse
  private Emission CFC_113;

  @CsvRecurse
  private Emission CFC_114;

  @CsvRecurse
  private Emission CFC_115;
}
