package com.ecapybara.CarbonX.runner;

import java.io.BufferedReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

/**
 * One-off: populates masterInputs.csv and masterOutputs.csv with many links
 * between masterProducts and masterProcesses. Run from backend dir:
 *   mvn exec:java -Dexec.mainClass="com.ecapybara.CarbonX.runner.PopulateMasterCsvs"
 * or run main() from IDE with working directory = backend.
 */
public class PopulateMasterCsvs {

  public static void main(String[] args) throws Exception {
    String projectRoot = System.getProperty("user.dir");
    Path tempDir = Paths.get(projectRoot, "temp");
    Path productsPath = tempDir.resolve("masterProducts.csv");
    Path processesPath = tempDir.resolve("masterProcesses.csv");
    Path inputsPath = tempDir.resolve("masterInputs.csv");
    Path outputsPath = tempDir.resolve("masterOutputs.csv");

    List<String> productIds = new ArrayList<>();
    List<String> productNames = new ArrayList<>();
    List<String> processIds = new ArrayList<>();
    List<String> processNames = new ArrayList<>();

    try (BufferedReader r = Files.newBufferedReader(productsPath)) {
      String header = r.readLine();
      String line;
      while ((line = r.readLine()) != null) {
        line = line.trim();
        if (line.isEmpty()) continue;
        String id = firstColumn(line);
        String name = secondColumn(line);
        if (id != null && id.startsWith("products/")) {
          productIds.add(id);
          productNames.add(name != null ? name : "");
        }
      }
    }
    try (BufferedReader r = Files.newBufferedReader(processesPath)) {
      r.readLine();
      String line;
      while ((line = r.readLine()) != null) {
        line = line.trim();
        if (line.isEmpty()) continue;
        String id = firstColumn(line);
        String name = secondColumn(line);
        if (id != null && id.startsWith("processes/")) {
          processIds.add(id);
          processNames.add(name != null ? name : "");
        }
      }
    }

    int np = productIds.size();
    int nproc = processIds.size();
    System.out.println("Products: " + np + ", Processes: " + nproc);

    Random rand = new Random(42);
    Set<String> inputPairs = new HashSet<>();
    Set<String> outputPairs = new HashSet<>();

    // Keep existing links from current files
    if (Files.exists(inputsPath)) {
      try (BufferedReader r = Files.newBufferedReader(inputsPath)) {
        r.readLine();
        String line;
        while ((line = r.readLine()) != null) {
          line = line.trim();
          if (line.isEmpty()) continue;
          String from = column(line, 1);
          String to = column(line, 3);
          if (from != null && to != null) inputPairs.add(from + "\t" + to);
        }
      }
    }
    if (Files.exists(outputsPath)) {
      try (BufferedReader r = Files.newBufferedReader(outputsPath)) {
        r.readLine();
        String line;
        while ((line = r.readLine()) != null) {
          line = line.trim();
          if (line.isEmpty()) continue;
          String from = column(line, 1);
          String to = column(line, 3);
          if (from != null && to != null) outputPairs.add(from + "\t" + to);
        }
      }
    }

    // Generate more: each process gets 2–6 random product inputs, 1–3 random product outputs
    int targetInputs = Math.min(2500, np * 3);
    int targetOutputs = Math.min(1500, nproc * 2);
    while (inputPairs.size() < targetInputs && np > 0 && nproc > 0) {
      String proc = processIds.get(rand.nextInt(nproc));
      String prod = productIds.get(rand.nextInt(np));
      inputPairs.add(prod + "\t" + proc);
    }
    while (outputPairs.size() < targetOutputs && np > 0 && nproc > 0) {
      String proc = processIds.get(rand.nextInt(nproc));
      String prod = productIds.get(rand.nextInt(np));
      outputPairs.add(proc + "\t" + prod);
    }

    // Build id->name maps
    java.util.Map<String, String> productNameMap = new java.util.HashMap<>();
    for (int i = 0; i < productIds.size(); i++) productNameMap.put(productIds.get(i), productNames.get(i));
    java.util.Map<String, String> processNameMap = new java.util.HashMap<>();
    for (int i = 0; i < processIds.size(); i++) processNameMap.put(processIds.get(i), processNames.get(i));

    // Write masterInputs.csv
    List<String> inputLines = new ArrayList<>();
    inputLines.add("id,from,productName,to,processName");
    int idx = 1;
    for (String pair : inputPairs) {
      String[] ab = pair.split("\t");
      String productId = ab[0];
      String processId = ab[1];
      String pName = escapeCsv(productNameMap.getOrDefault(productId, ""));
      String procName = escapeCsv(processNameMap.getOrDefault(processId, ""));
      inputLines.add("inputs/" + idx + "," + productId + "," + pName + "," + processId + "," + procName);
      idx++;
    }
    Files.write(inputsPath, inputLines);
    System.out.println("Wrote " + (inputLines.size() - 1) + " rows to masterInputs.csv");

    // Write masterOutputs.csv
    List<String> outputLines = new ArrayList<>();
    outputLines.add("id,from,processName,to,productName");
    idx = 1;
    for (String pair : outputPairs) {
      String[] ab = pair.split("\t");
      String processId = ab[0];
      String productId = ab[1];
      String procName = escapeCsv(processNameMap.getOrDefault(processId, ""));
      String pName = escapeCsv(productNameMap.getOrDefault(productId, ""));
      outputLines.add("outputs/" + idx + "," + processId + "," + procName + "," + productId + "," + pName);
      idx++;
    }
    Files.write(outputsPath, outputLines);
    System.out.println("Wrote " + (outputLines.size() - 1) + " rows to masterOutputs.csv");
  }

  private static String firstColumn(String line) {
    int i = line.indexOf(',');
    return i >= 0 ? line.substring(0, i).trim() : line.trim();
  }

  private static String secondColumn(String line) {
    int i = line.indexOf(',');
    if (i < 0) return null;
    int j = line.indexOf(',', i + 1);
    return j >= 0 ? line.substring(i + 1, j).trim() : line.substring(i + 1).trim();
  }

  private static String column(String line, int colIndex) {
    int start = 0;
    for (int k = 0; k < colIndex && start <= line.length(); k++) {
      int next = line.indexOf(',', start);
      if (next < 0) return null;
      start = next + 1;
    }
    int end = line.indexOf(',', start);
    if (end < 0) end = line.length();
    return line.substring(start, end).trim();
  }

  private static String escapeCsv(String s) {
    if (s == null) return "";
    if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
      return "\"" + s.replace("\"", "\"\"") + "\"";
    }
    return s;
  }
}
