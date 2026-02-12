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
@Edge("inputs")
@PersistentIndex(fields = {"id","key","productName","processName"})
public class Input extends com.ecapybara.carbonx.model.basic.Edge {  
  @NonNull
  @From
  @JsonAlias({"_from"})
  @CsvCustomBindByName(column = "from", converter = IdToProductConverter.class)
  private Product product;
  
  @Setter(AccessLevel.NONE)
  @CsvBindByName
  private String productName;

  @NonNull
  @To
  @JsonAlias({"_to"})
  @CsvCustomBindByName(column = "to", converter = IdToProcessConverter.class)
  private Process process;
  
  @Setter(AccessLevel.NONE)
  @CsvBindByName
  private String processName;

  @PersistenceCreator
  public Input(Product product, Process process) {
    super();
    this.product = product;
    this.productName = product.getName();
    this.process = process;
    this.processName = process.getName();
  }

  //custom setters
  public void setProduct(Product product) { 
    this.product = product;
    this.productName = product.getName();
  }
  public void setProcess(Process process) {
    this.process = process;
    this.processName = process.getName();
  }

  @Override
  public String toString() {
    return "Input [id=" + this.getId() + ", productId=" + this.getProduct().getId() + ", productName=" + this.getProductName() + ", processId=" + this.getProcess().getId() + ", processName=" + this.getProcess().getId() + "]";
  }
}
