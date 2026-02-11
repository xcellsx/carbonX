package com.ecapybara.carbonx.model.ipcc;

import com.ecapybara.carbonx.model.basic.Emission;
import com.opencsv.bean.CsvRecurse;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class HydrofluorocarbonChart{
  @CsvRecurse
  private Emission HFC_23;

  @CsvRecurse
  private Emission HFC_134a;

  @CsvRecurse
  private Emission HFC_152a;

  @CsvRecurse
  private Emission HFC_125;

  @CsvRecurse
  private Emission HFC_143a;

  @CsvRecurse
  private Emission HFC_32;

  @CsvRecurse
  private Emission HFC_227ea;

  @CsvRecurse
  private Emission HFC_245fa;

  @CsvRecurse
  private Emission HFC_365mfc;

  @CsvRecurse
  private Emission HFC_43_10mee;
}
