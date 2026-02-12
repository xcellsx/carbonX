package com.ecapybara.carbonx.model.lca;

import java.util.Map;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.fasterxml.jackson.annotation.JsonAlias;

import lombok.Data;

@Data
@Document("characterizationFactors")
public class CharacterizationFactor{

  @ArangoId // db document field: _id
  @JsonAlias({"_id"})
  private String id;

  @Id // db document field: _key
  @JsonAlias({"_key"})
  private String key;

  private String elementaryFlow; // e.g "CO2"
  private String unit;
  private String impactCategory; // e.g GlobalWarmingPotential
  private Map<String,Double> conversions; //eg. {"kg": 2.54, "litres": 3.22}
}
