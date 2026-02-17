package com.ecapybara.CarbonX.dto;

/**
 * Request to create a one-way link: Product → Process (product is input to process).
 * Use this to connect a product node to a process node in a single direction.
 */
public class InputLinkRequest {

  /** Document id of the product (e.g. "products/123" or product key). */
  private String productId;
  /** Document id of the process (e.g. "processes/456" or process key). */
  private String processId;

  public InputLinkRequest() {}

  public InputLinkRequest(String productId, String processId) {
    this.productId = productId;
    this.processId = processId;
  }

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public String getProcessId() {
    return processId;
  }

  public void setProcessId(String processId) {
    this.processId = processId;
  }
}
