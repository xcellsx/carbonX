package com.ecapybara.carbonx.model.ghg;

import java.util.Map;

import com.ecapybara.carbonx.utils.csv.ComplexMapConverter;
import com.opencsv.bean.CsvCustomBindByName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
public class Scope2 {
  @Builder.Default
  @CsvCustomBindByName(column = "emissionInformation.scope2.purchasedElectricity", converter = ComplexMapConverter.class)
  private Map<String, Map<String, Double>> purchasedElectricity = null;

  @Builder.Default
  @CsvCustomBindByName(column = "emissionInformation.scope2.purchasedSteam", converter = ComplexMapConverter.class)
  private Map<String, Map<String, Double>> purchasedSteam = null;

  @Builder.Default
  @CsvCustomBindByName(column = "emissionInformation.scope2.purchasedHeating", converter = ComplexMapConverter.class)
  private Map<String, Map<String, Double>> purchasedHeating = null;

  @Builder.Default
  @CsvCustomBindByName(column = "emissionInformation.scope2.purchasedCooling", converter = ComplexMapConverter.class)
  private Map<String, Map<String, Double>> purchasedCooling = null;
}

