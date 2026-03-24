package com.ecapybara.carbonx.model.maritime;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.processor.ConvertEmptyOrBlankStringsToNull;
import com.opencsv.bean.processor.PreAssignmentProcessor;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.experimental.SuperBuilder;

@Data @NoArgsConstructor @SuperBuilder(toBuilder = true) 
@Document("shiplogs")
@PersistentIndex(fields = {"id","key","name", "flag", "dateOnly"})
@JsonIgnoreProperties(ignoreUnknown = true)
public class ShipLog {

	@ArangoId // db document field: _id
	@JsonProperty("_id")
	@CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
	private String id;

	@Id // db document field: _key
	@JsonProperty("_key")
	@CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
	private String key;

	@JsonProperty("_class")
  	private final String clazz = this.getClass().getTypeName();

	@NonNull
	@CsvBindByName
	private String mmsi;

	@NonNull
	@CsvBindByName
	private Double latitude;

	@NonNull
	@CsvBindByName
	private Double longitude;

	@NonNull
	@CsvBindByName
	private Double speed;

	@NonNull
	@CsvBindByName
	private Double course;

	@NonNull
	@CsvBindByName
	private Double heading;

	@NonNull
	@CsvBindByName
	private String flag;

	@NonNull
	@CsvBindByName
	private String timestamp;

	@NonNull
	@CsvBindByName
	private String dateOnly;

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
