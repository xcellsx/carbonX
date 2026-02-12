package com.ecapybara.carbonx.model.issb;

import java.util.Collection;

import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.arangodb.springframework.annotation.Relations;
import com.ecapybara.carbonx.model.basic.Node;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.processor.ConvertEmptyOrBlankStringsToNull;
import com.opencsv.bean.processor.PreAssignmentProcessor;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data @NoArgsConstructor @EqualsAndHashCode(callSuper = true) @SuperBuilder(toBuilder = true) 
@Document("processes")
@PersistentIndex(fields = {"id","key","name", "type", "serviceProvider", "userId"})
public class Process extends Node {

  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  private String serviceProvider;

  @Relations(edges = Input.class, lazy = true)
  private Collection<Product> inputs;

  @Override
  public String toString() {
    return this.getId();
  }
}
