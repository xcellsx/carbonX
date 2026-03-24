package com.ecapybara.carbonx.utils.csv;

import com.opencsv.bean.AbstractBeanField;

import java.util.HashMap;
import java.util.Map;

public class SimpleMapConverter extends AbstractBeanField<Map<String, Double>, String> {

    @Override
    protected Map<String, Double> convert(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1); // Remove {}
        } else if (trimmed.startsWith("'{") && trimmed.endsWith("}'")) {
            trimmed = trimmed.substring(2, trimmed.length() - 2);
            // System.out.println(String.format("trimmed braces and quotations -> '%s'", trimmed));
        }

        Map<String, Double> result = new HashMap<>();
        
        // Handle both single pair and multiple pairs
        String[] pairs;
        if (trimmed.contains(",")) {
            pairs = trimmed.split(",");
        } else {
            // Single pair case: CO2:2.0 -> ["CO2:2.0"]
            pairs = new String[]{trimmed};
        }
        
        for (String pair : pairs) {
            if (pair.trim().isEmpty()) continue;
            String[] kv = pair.split("=");
            if (kv.length == 2) {
                String key = kv[0].trim();
                Double val = Double.valueOf(kv[1].trim());
                result.put(key, val);
            }
        }

        return result;
    }
}