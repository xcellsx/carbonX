package com.ecapybara.carbonx.model.lca;

import java.util.List;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.ecapybara.carbonx.model.basic.Metric;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.processor.ConvertEmptyOrBlankStringsToNull;
import com.opencsv.bean.processor.PreAssignmentProcessor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Data @NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
@Document("impactCategories")
@PersistentIndex(fields = {"id", "key","name","characterisationFactor","standardUnit"})
public class ImpactCategory {
  
  @ArangoId // db document field: _id
  @JsonAlias({"_id"})
  @CsvBindByName
  private String id;

  @Id // db document field: _key
  @JsonAlias({"_key"})
  private String key;

  @NonNull
  @CsvBindByName
  private String name; // e.g Climate Change

  @NonNull
  @CsvBindByName
  private String characterisationFactor; // e.g Global Warming Potential (GWP)

  @NonNull
  @CsvBindByName
  private String standardUnit; // e.g kgCO2e

  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  private List<Metric> relevantMetrics;
}
