package com.carbonx.lca.dto;

public class EnviFlowDTO {
    private FlowDetailsDTO flow;
    private boolean isInput;

    // Getters and Setters
    public FlowDetailsDTO getFlow() { return flow; }
    public void setFlow(FlowDetailsDTO flow) { this.flow = flow; }
    public boolean isInput() { return isInput; }
    public void setInput(boolean input) { isInput = input; }
}