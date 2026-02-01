package com.ecapybara.carbonx.model;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.ecapybara.carbonx.model.emissions.CarbonFootprint;
import com.fasterxml.jackson.annotation.JsonAlias;

@Document("DPPs")
@PersistentIndex(fields = {"name", "manufacturer", "serialNumber"})
public class DigitalProductPassport {

  @ArangoId // db document field: _id
  @JsonAlias({"_id"})
  private String id;

  @Id // db document field: _key
  @JsonAlias({"_key"})
  private String key;

  private String name; // e.g Model X
  private String manufacturer; // e.g Tesla
  private String serialNumber;
  private String batchNumber;
  private CarbonFootprint carbonFootprint;

  //constructor
  public DigitalProductPassport() {
    super();
  }

  public DigitalProductPassport(String name, String manufacturer) {
    super();
    this.name = name;
    this.manufacturer = manufacturer;
  }

  // getters & setters
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getKey() { return key; }
  public void setKey(String key) { this.key = key; }  
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getManufacturer() { return manufacturer; }
  public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
  public String getSerialNumber() { return serialNumber; }
  public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
  public String getBatchNumber() { return batchNumber; }
  public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
  public CarbonFootprint getCarbonFootprint() { return carbonFootprint; }
  public void setCarbonFootprint(CarbonFootprint carbonFootprint) { this.carbonFootprint = carbonFootprint; }
}
