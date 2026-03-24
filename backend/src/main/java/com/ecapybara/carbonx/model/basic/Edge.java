package com.ecapybara.carbonx.model.basic;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.From;
import com.arangodb.springframework.annotation.To;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.opencsv.bean.CsvBindByName;

import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Data @NoArgsConstructor @SuperBuilder(toBuilder = true) 
public abstract class Edge {
  @ArangoId // db document field: _id
  @JsonProperty("_id")
  @CsvBindByName
  private String id;

  @Id // db document field: _key
  @JsonProperty("_key")
  @Setter(AccessLevel.NONE) // No setter generated for this field
  private String key;

  @NonNull
  @From
  @JsonProperty("_from")
  @CsvBindByName
  private String from;

  @NonNull
  @To
  @JsonProperty("_to")
  @CsvBindByName
  private String to;

  public void setId(String id) {
    this.id = id;
    this.key = id.split("/")[1];
  }
}
