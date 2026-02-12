package com.ecapybara.carbonx.model.basic;

import java.util.List;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;

import lombok.Builder;
import lombok.Data;
import lombok.NonNull;

@Document("companyInfo")
@Data @Builder(toBuilder = true)
public class Company {
  @Id // db document field: _key
  private String id;

  @ArangoId // db document field: _id
  private String arangoId;

  @NonNull
  private String name;

  @NonNull
  private String sector;
  
  private String industry;
  private String headquarters;
  private String reportingYear;

  private List<String> applicableMetrics;
}
