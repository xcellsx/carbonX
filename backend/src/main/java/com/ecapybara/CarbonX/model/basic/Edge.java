package com.ecapybara.carbonx.model.basic;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.opencsv.bean.CsvBindByName;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data @NoArgsConstructor @SuperBuilder(toBuilder = true) 
public class Edge {
  @ArangoId // db document field: _id
  @JsonAlias({"_id"})
  @CsvBindByName
  private String id;

  @Id // db document field: _key
  @JsonAlias({"_key"})
  private String key;
}
