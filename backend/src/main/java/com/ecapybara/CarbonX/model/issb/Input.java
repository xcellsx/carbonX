package com.ecapybara.carbonx.model.issb;

import org.springframework.data.annotation.PersistenceCreator;

import com.arangodb.springframework.annotation.Edge;

import com.arangodb.springframework.annotation.PersistentIndex;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.bean.CsvBindByName;

import lombok.AccessLevel;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Data @NoArgsConstructor @EqualsAndHashCode(callSuper = true) @SuperBuilder(toBuilder = true)
@Edge("inputs")
@PersistentIndex(fields = {"id","key","productName","processName"})
@JsonIgnoreProperties(ignoreUnknown = true)
public class Input extends com.ecapybara.carbonx.model.basic.Edge {  
  
  @JsonProperty("_class")
  private final String clazz = this.getClass().getTypeName();
  
  @Setter(AccessLevel.NONE)
  @CsvBindByName
  private String productName;
  
  @Setter(AccessLevel.NONE)
  @CsvBindByName
  private String processName;

  @PersistenceCreator
  public Input(Product product, Process process) {
    super();
    this.setFrom(product.getId());
    this.productName = product.getName();
    this.setTo(process.getId());
    this.processName = process.getName();
  }

  //custom setters
  public void setProduct(Product product) { 
    this.setFrom(product.getId());
    this.productName = product.getName();
  }
  public void setProcess(Process process) {
    this.setTo(process.getId());
    this.processName = process.getName();
  }

  @Override
  public String toString() {
    try {
      ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
      return mapper.writeValueAsString(this);
    } catch (Exception e) {
      return super.toString();
    }
  }
}
