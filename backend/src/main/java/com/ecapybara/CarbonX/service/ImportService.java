package com.ecapybara.carbonx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class ImportService {

  @Autowired
  private WebClient webClient;

}
