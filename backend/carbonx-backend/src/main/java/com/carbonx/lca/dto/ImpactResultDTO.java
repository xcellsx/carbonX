package com.carbonx.lca.dto;

public class ImpactResultDTO {
    private double amount;
    private double contribution;
    private ImpactCategoryDTO impactCategory;

    // Getters and Setters
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public double getContribution() { return contribution; }
    public void setContribution(double contribution) { this.contribution = contribution; }
    public ImpactCategoryDTO getImpactCategory() { return impactCategory; }
    public void setImpactCategory(ImpactCategoryDTO impactCategory) { this.impactCategory = impactCategory; }
}