package com.ecapybara.carbonx.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ReportService {

  public void getReport(Map<String,String> values) throws IOException {
    // Get template
    String projectRoot = System.getProperty("user.dir");
    Path templateFolder = Paths.get(projectRoot, "src/main/resources/reports");
    Path filepath = templateFolder.resolve("scope3ReportingTemplate.pdf");
    log.info("Filepath identified -> {}", filepath);
    File template = new File(filepath.toString());

    // Load template
    try (PDDocument document = Loader.loadPDF(template);) {
      PDAcroForm acroForm = document.getDocumentCatalog().getAcroForm();

      // Fill in fields with supplied values
      if (acroForm != null && values != null) {
        for (Map.Entry<String, String> entry : values.entrySet()) {
          PDField field = acroForm.getField(entry.getKey());
          if (field != null) {
              field.setValue(entry.getValue());
          }
        }
        acroForm.flatten();
      }

      // Save the file in the 'temp' folder
      Path saveFolder = Paths.get(projectRoot, "temp");
      File report = new File(saveFolder.toString(), "filled_form.pdf");
      document.save(report);
    }
  }
}
