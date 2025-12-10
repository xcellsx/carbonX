package com.ecapybara.carbonx.model;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;

public class LCACalculationMethod {
  @Id // db document field: _key
  private String id;

  @ArangoId // db document field: _id
  private String arangoId;

  // private Formula formula;

  // private Table
}