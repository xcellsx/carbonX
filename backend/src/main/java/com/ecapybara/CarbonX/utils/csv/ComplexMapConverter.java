package com.ecapybara.carbonx.utils.csv;

import com.opencsv.bean.AbstractBeanField;

import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Slf4j
public class ComplexMapConverter extends AbstractBeanField<Map<String, Map<String, Double>>, String> {

  @Override
  protected Map<String, Map<String, Double>> convert(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        // System.out.println(String.format("Raw Input -> '%s'", value));

        String trimmed = value.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1); // Remove outer {}
            // System.out.println(String.format("trimmed braces -> '%s'", trimmed));

        } else if (trimmed.startsWith("'{") && trimmed.endsWith("}'")) {
            trimmed = trimmed.substring(2, trimmed.length() - 2);
            // System.out.println(String.format("trimmed braces and quotations -> '%s'", trimmed));
        }

        Map<String, Map<String, Double>> result = new HashMap<>();
        // System.out.println(String.format("Before split -> '%s'", trimmed));
        String[] outerPairs = trimmed.contains(",") ? trimmed.split("(?<=})+[,]") : new String[]{trimmed}; // THIS SPECIFIC REGEX SPLITS THE STRING SECTIONS OF MAPS IDENTIFIED BY '}' and ','
        // System.out.println(String.format("After split -> '%s'", Arrays.toString(outerPairs)));

        for (String outerPair : outerPairs) {
            if (outerPair.trim().isEmpty()) continue;
            String[] outerKV = outerPair.trim().split("=", 2); // THIS LINE IS VERY IMPORTANT, ESPECIALLY THE NUMBER TO PREVENT FURTHER SPLITTING OF ADDITIONAL ':' CHARACTERS IN THE STRING 
            if (outerKV.length != 2) continue;
            
            String gasName = outerKV[0].trim();  // "CO2", "CH4"
            String innerStr = outerKV[1].trim();
            
            // Single key-value pair: {kg:1.0} -> "kg:1.0"
            if (innerStr.startsWith("{") && innerStr.endsWith("}")) {
                innerStr = innerStr.substring(1, innerStr.length() - 1);
            }
            
            // Expect exactly one pair: unit:value
            String[] innerPairs = innerStr.split(","); // THIS LINE IS VERY IMPORTANT, ESPECIALLY THE NUMBER TO PREVENT FURTHER SPLITTING OF ADDITIONAL ':' CHARACTERS IN THE STRING
            Map<String, Double> innerMap = new HashMap<>();
            for (String innerPair : innerPairs) {
                if (innerPair.trim().isEmpty()) continue;
                String[] innerKV = innerPair.trim().split("="); // THIS LINE IS VERY IMPORTANT, ESPECIALLY THE NUMBER TO PREVENT FURTHER SPLITTING OF ADDITIONAL ':' CHARACTERS IN THE STRING 
                if (innerKV.length == 2) {
                    String unit = innerKV[0].trim();  // "kg"
                    Double amount = Double.parseDouble(innerKV[1].trim());  // 1.0
        
                    innerMap.put(unit, amount);
                }
            }
            
            result.put(gasName, innerMap);
        }
        
        return result;
    }
}