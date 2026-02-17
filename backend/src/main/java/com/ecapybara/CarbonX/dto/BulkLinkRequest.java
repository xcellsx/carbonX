package com.ecapybara.CarbonX.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Request to create many input and output links in one call.
 * Use this to bulk-create edges between 1000+ products and processes.
 */
public class BulkLinkRequest {

  /** Input links: Product → Process. */
  private List<InputLinkRequest> inputs = new ArrayList<>();
  /** Output links: Process → Product. */
  private List<OutputLinkRequest> outputs = new ArrayList<>();

  public List<InputLinkRequest> getInputs() {
    return inputs;
  }

  public void setInputs(List<InputLinkRequest> inputs) {
    this.inputs = inputs != null ? inputs : new ArrayList<>();
  }

  public List<OutputLinkRequest> getOutputs() {
    return outputs;
  }

  public void setOutputs(List<OutputLinkRequest> outputs) {
    this.outputs = outputs != null ? outputs : new ArrayList<>();
  }
}
