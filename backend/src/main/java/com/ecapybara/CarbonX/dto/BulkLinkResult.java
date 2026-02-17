package com.ecapybara.CarbonX.dto;

import java.util.ArrayList;
import java.util.List;

/** Result of bulk linkage creation. */
public class BulkLinkResult {

  private int inputsCreated;
  private int inputsSkipped; // already existed
  private int outputsCreated;
  private int outputsSkipped;
  private List<String> errors = new ArrayList<>();

  public int getInputsCreated() {
    return inputsCreated;
  }

  public void setInputsCreated(int inputsCreated) {
    this.inputsCreated = inputsCreated;
  }

  public int getInputsSkipped() {
    return inputsSkipped;
  }

  public void setInputsSkipped(int inputsSkipped) {
    this.inputsSkipped = inputsSkipped;
  }

  public int getOutputsCreated() {
    return outputsCreated;
  }

  public void setOutputsCreated(int outputsCreated) {
    this.outputsCreated = outputsCreated;
  }

  public int getOutputsSkipped() {
    return outputsSkipped;
  }

  public void setOutputsSkipped(int outputsSkipped) {
    this.outputsSkipped = outputsSkipped;
  }

  public List<String> getErrors() {
    return errors;
  }

  public void setErrors(List<String> errors) {
    this.errors = errors != null ? errors : new ArrayList<>();
  }
}
