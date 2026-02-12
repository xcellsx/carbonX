package com.ecapybara.carbonx.model.ghg;

import java.util.Map;

import com.ecapybara.carbonx.utils.csv.SimpleMapConverter;
import com.opencsv.bean.CsvCustomBindByName;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class CarbonFootprint {
  @CsvCustomBindByName(column = "dpp.carbonFootprint.scope1", converter = SimpleMapConverter.class)
  private Map<String, Double> scope1; //e.g {"kgCO2e": 20.2}

  @CsvCustomBindByName(column = "dpp.carbonFootprint.scope2", converter = SimpleMapConverter.class)
  private Map<String, Double> scope2; //e.g {"kgCO2e": 20.2}

  @CsvCustomBindByName(column = "dpp.carbonFootprint.scope3", converter = SimpleMapConverter.class)
  private Map<String, Double> scope3; //eg. {"kgCO2e": 20.2}
}
