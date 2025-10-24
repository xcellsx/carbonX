package com.carbonx.lca.dto;

public class InventoryFlowDTO {
    private double amount;
    private double contribution;
    private EnviFlowDTO enviFlow;

    // Getters and Setters
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public double getContribution() { return contribution; }
    public void setContribution(double contribution) { this.contribution = contribution; }
    public EnviFlowDTO getEnviFlow() { return enviFlow; }
    public void setEnviFlow(EnviFlowDTO enviFlow) { this.enviFlow = enviFlow; }
}