package com.ecapybara.carbonx.model.basic;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.ecapybara.carbonx.model.ghg.CarbonFootprint;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.CsvRecurse;

import io.micrometer.common.lang.NonNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
@Document("DPPs")
@PersistentIndex(fields = {"name", "manufacturer", "serialNumber"})
public class DigitalProductPassport {

  @ArangoId // db document field: _id
  @JsonProperty("_id")
  private String id;

  @Id // db document field: _key
  @JsonProperty("_key")
  private String key;

  @NonNull
  @CsvBindByName(column = "dpp.name")
  private String name; // e.g Model X
  
  @NonNull
  @CsvBindByName(column = "dpp.manufacturer")
  private String manufacturer; // e.g Tesla

  @CsvBindByName(column = "dpp.serialNumber")
  private String serialNumber;

  @CsvBindByName(column = "dpp.batchNumber")
  private String batchNumber;

  @Builder.Default
  @CsvRecurse
  private CarbonFootprint carbonFootprint = new CarbonFootprint();
}
