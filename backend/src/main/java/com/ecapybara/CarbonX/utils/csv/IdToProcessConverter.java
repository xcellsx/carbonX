package com.ecapybara.carbonx.utils.csv;

import com.ecapybara.carbonx.ApplicationContextHolder;
import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.repository.ProcessRepository;
import com.opencsv.bean.AbstractBeanField;

public class IdToProcessConverter extends AbstractBeanField<Process, String> {

  private ProcessRepository processRepository;

  public IdToProcessConverter() {
    super();
  }

  private synchronized ProcessRepository getProcessRepository() {
    if (processRepository == null) {
      try {
        processRepository = ApplicationContextHolder.getBean(ProcessRepository.class);
      } catch (Exception e) {
        System.err.println("Failed to initialize ProcessRepository: " + e.getMessage());
      }
    }
    return processRepository;
  }

  @Override
  public Process convert(String value) {
    ProcessRepository repo = getProcessRepository();
    return repo.findById(value).orElse(null);
  }
}
