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
@Edge("outputs")
@PersistentIndex(fields = {"arangoId","id","processName","productName"})
@JsonIgnoreProperties(ignoreUnknown = true)
public class Output extends com.ecapybara.carbonx.model.basic.Edge {

  @JsonProperty("_class")
  private final String clazz = this.getClass().getTypeName();

  @Setter(AccessLevel.NONE)
  @CsvBindByName
  private String processName;
  
  @Setter(AccessLevel.NONE)
  @CsvBindByName
  private String productName;

  @PersistenceCreator
  public Output(Process process, Product product) {
    super();
    this.setFrom(process.getId());
    this.processName = process.getName();
    this.setTo(product.getId());
    this.productName = product.getName();
  }

  // custom setters
  public void setProcess(Process process) {
    this.setFrom(process.getId());
    this.processName = process.getName();
  }
  public void setProduct(Product product) { 
    this.setTo(product.getId());
    this.productName = product.getName();
  }

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
