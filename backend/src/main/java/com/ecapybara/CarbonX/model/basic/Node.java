package com.ecapybara.carbonx.model.basic;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.ecapybara.carbonx.model.ghg.EmissionInformation;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.CsvRecurse;
import com.opencsv.bean.processor.ConvertEmptyOrBlankStringsToNull;
import com.opencsv.bean.processor.PreAssignmentProcessor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.experimental.SuperBuilder;

@Data @NoArgsConstructor @AllArgsConstructor @SuperBuilder(toBuilder = true)
public class Node {
  @ArangoId // db document field: _id
  @JsonAlias({"_id"})
  @CsvBindByName
  private String id;

  @Id // db document field: _key
  @JsonAlias({"_key"})
  private String key;

  @NonNull
  @CsvBindByName
  private String name;

  @NonNull
  @CsvBindByName
  private String type;

  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  private String quantifiableUnit;

  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  private Double quantityValue;

  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  @CsvBindByName(column = "owner")
  private String userId; // User who created/owns this document

  @Builder.Default
  @CsvRecurse
  private EmissionInformation emissionInformation = new EmissionInformation(); // e.g {"Scope 1" : ExtractionEmissionCharts, "Scope 2" : ProcessingEmissionCharts, "Scope 3" : TransportationEmissionCharts}
  
  @Builder.Default
  @CsvRecurse
  private DigitalProductPassport DPP = new DigitalProductPassport();
}
