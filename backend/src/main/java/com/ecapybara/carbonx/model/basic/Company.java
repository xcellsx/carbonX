package com.ecapybara.carbonx.model.basic;

import java.util.List;

import com.arangodb.springframework.annotation.Document;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
@Document("companies")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Company {

  @JsonProperty("_class")
  private final String clazz = this.getClass().getTypeName();
  
  private String name;

  private String sector;
  
  private String industry;
  private String headquarters;
  private String reportingYear;

  private List<String> applicableMetrics;

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
