package com.ecapybara.carbonx.model.basic;

import java.util.Map;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.ecapybara.carbonx.utils.csv.SimpleMapConverter;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.CsvCustomBindByName;
import com.opencsv.bean.processor.ConvertEmptyOrBlankStringsToNull;
import com.opencsv.bean.processor.PreAssignmentProcessor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
@Document("applicableMetrics")
@PersistentIndex(fields = {"id", "key","name"})
@JsonIgnoreProperties(ignoreUnknown = true)
public class Metric {
    @ArangoId // db document field: _id
    @JsonProperty("_id")
    @CsvBindByName
    private String id;

    @Id // db document field: _key
    @JsonProperty("_key")
    private String key;

    @CsvBindByName
    private String name;

    @CsvBindByName @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
    private String description;

    @CsvCustomBindByName(converter = SimpleMapConverter.class) @PreAssignmentProcessor(processor = ConvertEmptyOrBlankStringsToNull.class)
    private Map<String,Double> value; // {"unit": value}

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
