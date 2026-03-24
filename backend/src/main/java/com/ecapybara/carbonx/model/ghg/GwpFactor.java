package com.ecapybara.carbonx.model.ghg;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.opencsv.bean.CsvBindByName;
import lombok.Data;
@Data

public class GwpFactor {
    @JsonProperty("_key")
    @CsvBindByName(column = "_key")
    private String key;

    @CsvBindByName(column = "standard")
    private String standard;

    @CsvBindByName(column = "gwp")
    private double gwp;
}