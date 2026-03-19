package com.ecapybara.carbonx.model.maritime;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.ecapybara.carbonx.model.basic.Node;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.processor.ConvertEmptyOrBlankStringsToNull;
import com.opencsv.bean.processor.PreAssignmentProcessor;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.experimental.SuperBuilder;

@Data @NoArgsConstructor @EqualsAndHashCode(callSuper = true) @SuperBuilder(toBuilder = true) 
@Document("ships")
@PersistentIndex(fields = {"id","key","name", "flag", "dateOnly"})
@JsonIgnoreProperties(ignoreUnknown = true)
public class Ship extends Node {

	@Id // db document field: _key
	@JsonProperty("_key")
	@JsonAlias("mmsi")
	@CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
	private String key;

	@JsonProperty("_class")
  	private final String clazz = this.getClass().getTypeName();

	@NonNull
	@CsvBindByName
	private String flag;

	@Override
	public String toString() {
		try {
			ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
			return mapper.writeValueAsString(this);
		} catch (Exception e) {
			return super.toString(); // fallback
		}
	}
}
