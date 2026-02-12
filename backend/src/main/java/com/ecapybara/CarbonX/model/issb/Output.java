package com.ecapybara.carbonx.model.issb;

import org.springframework.data.annotation.PersistenceCreator;

import com.arangodb.springframework.annotation.Edge;
import com.arangodb.springframework.annotation.From;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.arangodb.springframework.annotation.To;
import com.ecapybara.carbonx.utils.csv.IdToProcessConverter;
import com.ecapybara.carbonx.utils.csv.IdToProductConverter;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.CsvCustomBindByName;

import lombok.AccessLevel;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Data @NoArgsConstructor @EqualsAndHashCode(callSuper = true) @SuperBuilder(toBuilder = true)
@Edge("outputs")
@PersistentIndex(fields = {"arangoId","id","processName","productName"})
public class Output extends com.ecapybara.carbonx.model.basic.Edge{

  @NonNull
  @From
  @JsonAlias({"_from"})
  @CsvCustomBindByName(column = "from", converter = IdToProcessConverter.class)
  private Process process;

  @Setter(AccessLevel.NONE)
  @CsvBindByName
  private String processName;

  @NonNull
  @To
  @JsonAlias({"_to"})
  @CsvCustomBindByName(column = "to", converter = IdToProductConverter.class)
  private Product product;
  
  @Setter(AccessLevel.NONE)
  @CsvBindByName
  private String productName;

  @PersistenceCreator
  public Output(Process process, Product product) {
    super();
    this.process = process;
    this.processName = process.getName();
    this.product = product;
    this.productName = product.getName();
  }

  // custom setters
  public void setProcess(Process process) {
    this.process = process;
    this.processName = process.getName();
  }
  public void setProduct(Product product) { 
    this.product = product;
    this.productName = product.getName();
  }

  @Override
  public String toString() {
    return "Output [id=" + this.getId() + ", processId=" + this.getProcess().getId() + ", processName=" + this.getProcess().getId() + ", productId=" + this.getProduct().getId() + ", productName=" + this.getProductName() + "]";
  }
}
