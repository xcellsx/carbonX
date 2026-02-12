package com.ecapybara.carbonx.model.ipcc;

import java.util.Map;

import com.opencsv.bean.CsvRecurse;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class HydrofluorocarbonChart{
  @CsvRecurse
  private Map<String,Object> HFC_23;

  @CsvRecurse
  private Map<String,Object> HFC_134a;

  @CsvRecurse
  private Map<String,Object> HFC_152a;

  @CsvRecurse
  private Map<String,Object> HFC_125;

  @CsvRecurse
  private Map<String,Object> HFC_143a;

  @CsvRecurse
  private Map<String,Object> HFC_32;

  @CsvRecurse
  private Map<String,Object> HFC_227ea;

  @CsvRecurse
  private Map<String,Object> HFC_245fa;

  @CsvRecurse
  private Map<String,Object> HFC_365mfc;

  @CsvRecurse
  private Map<String,Object> HFC_43_10mee;
}
