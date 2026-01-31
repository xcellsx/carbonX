// LcaResult.java
package com.carbonx.demo.dto;
import java.util.List;

public class LcaResult {
    private List<ComponentResult> results;
    public LcaResult(List<ComponentResult> results) {
        this.results = results;
    }
    public List<ComponentResult> getResults() { return results; }
    public void setResults(List<ComponentResult> results) { this.results = results; }

    public static class ComponentResult {
        private String processId;
        private Double weight;
        private Double lcaValue;
        private String unit;
        private String processName; // add if needed

        public ComponentResult() {}
        public ComponentResult(String processId, Double weight, Double lcaValue, String unit, String processName) {
            this.processId = processId;
            this.weight = weight;
            this.lcaValue = lcaValue;
            this.unit = unit;
            this.processName = processName;
        }
        // getters and setters
        public String getProcessId() { return processId; }
        public void setProcessId(String processId) { this.processId = processId; }
        public Double getWeight() { return weight; }
        public void setWeight(Double weight) { this.weight = weight; }
        public Double getLcaValue() { return lcaValue; }
        public void setLcaValue(Double lcaValue) { this.lcaValue = lcaValue; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public String getProcessName() { return processName; }
        public void setProcessName(String processName) { this.processName = processName; }
    }
}
