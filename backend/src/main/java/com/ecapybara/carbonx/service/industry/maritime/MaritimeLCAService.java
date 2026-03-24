package com.ecapybara.carbonx.service.industry.maritime;

import java.time.ZonedDateTime;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ecapybara.carbonx.service.arango.ArangoQueryService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MaritimeLCAService {
    @Autowired
    private ArangoQueryService queryService;
    
    public Map<String,Object> calculateRoughCarbonFootprint(String database, String key) {
        Map<String,Double> travelEmissions = this.calculateTravelEmissions(database, key);
        return Map.of(  "scope1", travelEmissions,
                        "scope2", Map.of(),
                        "scope3", Map.of());
    }

    private Map<String,Double> calculateTravelEmissions(String database, String mmsi) { //e.g {"kgCO2e":3456}
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");

        // Get the array of timestamps using AQL
        String query =  "FOR log IN shipLogs \r\n" +
                        "  FILTER log.mmsi == @mmsi \r\n" +
                        "  RETURN log.timestamp";
        Map<String, String> bindVars = Map.of(  "mmsi", mmsi);

        List<String> timestamps = (List<String>) queryService.executeQuery(database, query, bindVars, 100, null, null, null).block().get("result");

        // Convert List<String> into List<ZonedDateTime>
        List<ZonedDateTime> times = timestamps.stream()
                                            .map(s -> ZonedDateTime.parse(s, formatter))
                                            .toList();

        // Determine the earliest and latest timestamp
        ZonedDateTime min = times.stream().min(ZonedDateTime::compareTo).orElseThrow();
        ZonedDateTime max = times.stream().max(ZonedDateTime::compareTo).orElseThrow();

        // Determine the elapsed duration
        Duration elapsed = Duration.between(min, max);
        long seconds = elapsed.getSeconds();

        // Determine average speed
        query = "FOR log IN shipLogs \r\n" +
                "  FILTER log.mmsi == @mmsi \r\n" +
                "  COLLECT AGGREGATE speed = AVERAGE(log.speed) \r\n" +
                "  RETURN speed";

        List<Double> result = (List<Double>) queryService.executeQuery(database, query, bindVars, 100, null, null, null).block().get("result");
        Double avgSpeed = result.get(0);

        // Calculate total distance covered
        Double distance = avgSpeed * seconds / 1000; // units is in "km"

        // Calculate carbon emissions
        Double emissionValue = distance * 60;

        return Map.of("kgCO2e", emissionValue);
    }
}
