package com.ecapybara.carbonx.model.ipcc;

import java.util.Map;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.ecapybara.carbonx.utils.csv.SimpleMapConverter;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.CsvCustomBindByName;
import com.opencsv.bean.processor.ConvertEmptyOrBlankStringsToNull;
import com.opencsv.bean.processor.PreAssignmentProcessor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Data @NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
@Document("gwp")
@PersistentIndex(fields = {"id", "key","gasName","chemicalGroup"})
public class GlobalWarmingPotential {

  @ArangoId // db document field: _id
  @JsonAlias({"_id"})
  @CsvBindByName
  private String id;

  @Id // db document field: _key
  @JsonAlias({"_key"})
  private String key;

  @NonNull
  @CsvBindByName
  private String gasName;

  @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
  private String chemicalGroup;

  @NonNull
  @CsvCustomBindByName(converter = SimpleMapConverter.class)
  private Map<String,Double> values; // e.g {AR5:245.55, AR6:177.6}
}
