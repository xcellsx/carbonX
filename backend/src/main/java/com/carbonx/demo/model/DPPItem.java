package com.carbonx.demo.model;
// src/main/java/com/carbonx/demo/model/DPPItem.java
public class DPPItem {
    private String component;
    private String process;
    private double weightKg;

    public DPPItem(String component, String process, double weightKg) {
        this.component = component;
        this.process = process;
        this.weightKg = weightKg;
    }
    // Getters and setters
    public String getComponent() {
        return component;
    }
    public void setComponent(String component) {
        this.component = component;
    }
    public String getProcess() {
        return process;
    }
    public void setProcess(String process) {
        this.process = process;
    }
    public double getWeightKg() {
        return weightKg;
    }
    public void setWeightKg(double weightKg) {
        this.weightKg = weightKg;
    }
}
