package com.ecapybara.carbonx.model.ghg;

import java.util.Map;

import com.ecapybara.carbonx.utils.csv.ComplexMapConverter;
import com.opencsv.bean.CsvCustomBindByName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data @NoArgsConstructor @AllArgsConstructor @SuperBuilder(toBuilder = true)
public class Scope1 {
  @CsvCustomBindByName(column = "emissionInformation.scope1.stationaryCombustion", converter = ComplexMapConverter.class)
  private Map<String, Map<String, Double>> stationaryCombustion;

  @Builder.Default
  @CsvCustomBindByName(column = "emissionInformation.scope1.mobileCombustion", converter = ComplexMapConverter.class)
  private Map<String, Map<String, Double>> mobileCombustion = null;

  @Builder.Default
  @CsvCustomBindByName(column = "emissionInformation.scope1.fugitiveEmissions", converter = ComplexMapConverter.class)
  private Map<String, Map<String, Double>> fugitiveEmissions = null;

  @Builder.Default
  @CsvCustomBindByName(column = "emissionInformation.scope1.processEmissions", converter = ComplexMapConverter.class)
  private Map<String, Map<String, Double>> processEmissions = null;
}
