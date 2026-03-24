package com.ecapybara.carbonx.service.industry.maritime;

import java.time.Duration;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ecapybara.carbonx.service.arango.ArangoQueryService;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MaritimeLCAService {
    @Autowired
    private ArangoQueryService queryService;

    private static final int QUERY_BATCH = 50_000;

    private final List<DateTimeFormatter> timestampFormatters = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss VV"),
            DateTimeFormatter.ISO_ZONED_DATE_TIME,
            DateTimeFormatter.ISO_OFFSET_DATE_TIME
    );

    public Map<String, Object> calculateRoughCarbonFootprint(String database, String mmsi) {
        Map<String, Double> travelEmissions = calculateTravelEmissions(database, mmsi);
        return Map.of(
                "scope1", travelEmissions,
                "scope2", Map.of(),
                "scope3", Map.of());
    }

    private ZonedDateTime tryParseTimestamp(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String s = raw.trim();
        for (DateTimeFormatter f : timestampFormatters) {
            try {
                return ZonedDateTime.parse(s, f);
            } catch (DateTimeParseException ignored) {
                // try next
            }
        }
        log.debug("Could not parse ship log timestamp: {}", s);
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Double> calculateTravelEmissions(String database, String mmsi) {
        Map<String, String> bindVars = Map.of("mmsi", mmsi);

        // Single aggregation pass: avoids 100-row cursor limit and empty-list crashes.
        String query = "FOR log IN shipLogs FILTER TO_STRING(log.mmsi) == TO_STRING(@mmsi) "
                + "COLLECT AGGREGATE minTs = MIN(log.timestamp), maxTs = MAX(log.timestamp), avgSpeed = AVERAGE(log.speed) "
                + "RETURN { minTs, maxTs, avgSpeed }";

        try {
            var response = queryService.executeQuery(database, query, bindVars, QUERY_BATCH, null, null, null).block();
            if (response == null || response.get("result") == null) {
                return Map.of("kgCO2e", 0.0);
            }
            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> rows = mapper.convertValue(response.get("result"), List.class);
            if (rows == null || rows.isEmpty()) {
                return Map.of("kgCO2e", 0.0);
            }
            Map<String, Object> row = rows.get(0);
            String minTs = row.get("minTs") != null ? String.valueOf(row.get("minTs")) : null;
            String maxTs = row.get("maxTs") != null ? String.valueOf(row.get("maxTs")) : null;
            Number avgNum = null;
            if (row.get("avgSpeed") instanceof Number n) {
                avgNum = n;
            } else if (row.get("avgSpeed") != null) {
                try {
                    avgNum = Double.parseDouble(String.valueOf(row.get("avgSpeed")));
                } catch (NumberFormatException ignored) {
                    avgNum = 0.0;
                }
            }
            double avgSpeed = avgNum != null ? avgNum.doubleValue() : 0.0;

            if (minTs == null || maxTs == null || minTs.isBlank() || maxTs.isBlank()) {
                return Map.of("kgCO2e", 0.0);
            }

            ZonedDateTime min = tryParseTimestamp(minTs);
            ZonedDateTime max = tryParseTimestamp(maxTs);
            if (min == null || max == null) {
                log.warn("Maritime LCA: could not parse min/max timestamps for mmsi={} min={} max={}", mmsi, minTs, maxTs);
                return Map.of("kgCO2e", 0.0);
            }

            long seconds = Math.max(0L, Duration.between(min, max).getSeconds());
            double distance = avgSpeed * seconds / 1000.0;
            double emissionValue = distance * 60.0;

            return Map.of("kgCO2e", emissionValue);
        } catch (Exception e) {
            log.warn("Maritime LCA failed for mmsi={} database={}: {}", mmsi, database, e.getMessage());
            return Map.of("kgCO2e", 0.0);
        }
    }
}
