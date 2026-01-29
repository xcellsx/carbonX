package com.ecapybara.carbonx.service;

import org.springframework.stereotype.Service;

import com.ecapybara.carbonx.model.Node;

@Service
public class LCAService {

  public void calculate(Node node) {
    // 1. calculate in detail the GWP of each scope using the emission charts

    // 2. Sum them up

    // 3. POST it to the emission information of the DPP
  }
}
