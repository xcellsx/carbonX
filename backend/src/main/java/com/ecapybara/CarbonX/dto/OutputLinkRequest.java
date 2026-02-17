package com.ecapybara.carbonx.dto;

/**
 * Request to create a one-way link: Process → Product (process produces product).
 * Use this to connect a process node to a product node in a single direction.
 */
public class OutputLinkRequest {

  /** Document id of the process (e.g. "processes/456" or process key). */
  private String processId;
  /** Document id of the product (e.g. "products/123" or product key). */
  private String productId;

  public OutputLinkRequest() {}

  public OutputLinkRequest(String processId, String productId) {
    this.processId = processId;
    this.productId = productId;
  }

  public String getProcessId() {
    return processId;
  }

  public void setProcessId(String processId) {
    this.processId = processId;
  }

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }
}
