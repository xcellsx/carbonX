package com.ecapybara.carbonx.model.ghg;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.CsvRecurse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
public class EmissionInformation {
  @Builder.Default
  @CsvBindByName(column = "emission.description")
  private String description = "GHG";
  
  @Builder.Default
  @CsvRecurse
  private Scope1 scope1 = new Scope1();

  @Builder.Default
  @CsvRecurse
  private Scope2 scope2 = new Scope2();

  @Builder.Default
  @CsvRecurse
  private Scope3 scope3 = new Scope3();
}
