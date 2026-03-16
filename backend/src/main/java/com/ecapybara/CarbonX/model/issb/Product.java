package com.ecapybara.carbonx.model.issb;

import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.ecapybara.carbonx.model.basic.Node;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.processor.ConvertEmptyOrBlankStringsToNull;
import com.opencsv.bean.processor.PreAssignmentProcessor;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data @NoArgsConstructor @EqualsAndHashCode(callSuper = true) @SuperBuilder(toBuilder = true)
@Document("products")
@PersistentIndex(fields = {"id", "key","name","type","productOrigin","userId"})
@JsonIgnoreProperties(ignoreUnknown = true)
public class Product extends Node {

  @JsonProperty("_class")
  private final String clazz = this.getClass().getTypeName();

  @CsvBindByName
  private String name;
  
  @CsvBindByName
  private String type;

  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  private String quantifiableUnit;

  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  private Double quantityValue;

  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  @CsvBindByName(column = "owner")
  private String userId; // User who created/owns this document

  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  private String productOrigin; // e.g supplier/user

  // Additional fields for inventory management
  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  private String uploadedFile; // Filename of uploaded BOM file

  @Override
  public String toString() {
    try {
      ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
      return mapper.writeValueAsString(this);
    } catch (Exception e) {
      return super.toString(); // fallback
    }
  }
}
