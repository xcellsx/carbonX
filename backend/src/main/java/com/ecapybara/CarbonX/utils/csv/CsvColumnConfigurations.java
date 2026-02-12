package com.ecapybara.carbonx.utils.csv;

import java.util.Arrays;
import java.util.List;

import lombok.Getter;

@Getter
public class CsvColumnConfigurations {

  private final List<CsvColumn> productColumns;
  private final List<CsvColumn> processColumns;
  private final List<CsvColumn> inputColumns;
  private final List<CsvColumn> outputColumns;

  public CsvColumnConfigurations() {
    this.productColumns = Arrays.asList(
            CsvColumn.of("id").withHeader("id"),
            CsvColumn.of("name").withHeader("name"),
            CsvColumn.of("type").withHeader("type"),
            CsvColumn.of("quantifiableUnit").withHeader("quantifiableUnit"),
            CsvColumn.of("quantityValue").withHeader("quantityValue"),
            CsvColumn.of("productOrigin").withHeader("productOrigin"),
            CsvColumn.of("userId").withHeader("owner"),
            CsvColumn.of("uploadedFile").withHeader("uploadedFile"),
            CsvColumn.of("emissionInformation.description").withHeader("emissionInformation.description"),
            CsvColumn.of("emissionInformation.scope1.stationaryCombustion").withHeader("emissionInformation.scope1.stationaryCombustion"),
            CsvColumn.of("emissionInformation.scope1.mobileCombustion").withHeader("emissionInformation.scope1.mobileCombustion"),
            CsvColumn.of("emissionInformation.scope1.fugitiveEmissions").withHeader("emissionInformation.scope1.fugitiveEmissions"),
            CsvColumn.of("emissionInformation.scope1.processEmissions").withHeader("emissionInformation.scope1.processEmissions"),
            CsvColumn.of("emissionInformation.scope2.purchasedElectricity").withHeader("emissionInformation.scope2.purchasedElectricity"),
            CsvColumn.of("emissionInformation.scope2.purchasedSteam").withHeader("emissionInformation.scope2.purchasedSteam"),
            CsvColumn.of("emissionInformation.scope2.purchasedHeating").withHeader("emissionInformation.scope2.purchasedHeating"),
            CsvColumn.of("emissionInformation.scope2.purchasedCooling").withHeader("emissionInformation.scope2.purchasedCooling"),
            CsvColumn.of("emissionInformation.scope3.category1").withHeader("emissionInformation.scope3.category1"),
            CsvColumn.of("emissionInformation.scope3.category2").withHeader("emissionInformation.scope3.category2"),
            CsvColumn.of("emissionInformation.scope3.category3").withHeader("emissionInformation.scope3.category3"),
            CsvColumn.of("emissionInformation.scope3.category4").withHeader("emissionInformation.scope3.category4"),
            CsvColumn.of("emissionInformation.scope3.category5").withHeader("emissionInformation.scope3.category5"),
            CsvColumn.of("emissionInformation.scope3.category6").withHeader("emissionInformation.scope3.category6"),
            CsvColumn.of("emissionInformation.scope3.category7").withHeader("emissionInformation.scope3.category7"),
            CsvColumn.of("emissionInformation.scope3.category8").withHeader("emissionInformation.scope3.category8"),
            CsvColumn.of("emissionInformation.scope3.category9").withHeader("emissionInformation.scope3.category9"),
            CsvColumn.of("emissionInformation.scope3.category10").withHeader("emissionInformation.scope3.category10"),
            CsvColumn.of("emissionInformation.scope3.category11").withHeader("emissionInformation.scope3.category11"),
            CsvColumn.of("emissionInformation.scope3.category12").withHeader("emissionInformation.scope3.category12"),
            CsvColumn.of("emissionInformation.scope3.category13").withHeader("emissionInformation.scope3.category13"),
            CsvColumn.of("emissionInformation.scope3.category14").withHeader("emissionInformation.scope3.category14"),
            CsvColumn.of("emissionInformation.scope3.category15").withHeader("emissionInformation.scope3.category15"),
            CsvColumn.of("dpp.name").withHeader("dpp.name"),
            CsvColumn.of("dpp.manufacturer").withHeader("dpp.manufacturer"),
            CsvColumn.of("dpp.serialNumber").withHeader("dpp.serialNumber"),
            CsvColumn.of("dpp.batchNumber").withHeader("dpp.batchNumber"),
            CsvColumn.of("dpp.carbonFootprint.scope1").withHeader("dpp.carbonFootprint.scope1"),
            CsvColumn.of("dpp.carbonFootprint.scope2").withHeader("dpp.carbonFootprint.scope2"),
            CsvColumn.of("dpp.carbonFootprint.scope3").withHeader("dpp.carbonFootprint.scope3")
    );

    this.processColumns = Arrays.asList(
            CsvColumn.of("id").withHeader("id"),
            CsvColumn.of("name").withHeader("name"),
            CsvColumn.of("type").withHeader("type"),
            CsvColumn.of("quantifiableUnit").withHeader("quantifiableUnit"),
            CsvColumn.of("quantityValue").withHeader("quantityValue"),
            CsvColumn.of("serviceProvider").withHeader("serviceProvider"),
            CsvColumn.of("userId").withHeader("owner"),
            CsvColumn.of("emissionInformation.description").withHeader("emissionInformation.description"),
            CsvColumn.of("emissionInformation.scope1.stationaryCombustion").withHeader("emissionInformation.scope1.stationaryCombustion"),
            CsvColumn.of("emissionInformation.scope1.mobileCombustion").withHeader("emissionInformation.scope1.mobileCombustion"),
            CsvColumn.of("emissionInformation.scope1.fugitiveEmissions").withHeader("emissionInformation.scope1.fugitiveEmissions"),
            CsvColumn.of("emissionInformation.scope1.processEmissions").withHeader("emissionInformation.scope1.processEmissions"),
            CsvColumn.of("emissionInformation.scope2.purchasedElectricity").withHeader("emissionInformation.scope2.purchasedElectricity"),
            CsvColumn.of("emissionInformation.scope2.purchasedSteam").withHeader("emissionInformation.scope2.purchasedSteam"),
            CsvColumn.of("emissionInformation.scope2.purchasedHeating").withHeader("emissionInformation.scope2.purchasedHeating"),
            CsvColumn.of("emissionInformation.scope2.purchasedCooling").withHeader("emissionInformation.scope2.purchasedCooling"),
            CsvColumn.of("emissionInformation.scope3.category1").withHeader("emissionInformation.scope3.category1"),
            CsvColumn.of("emissionInformation.scope3.category2").withHeader("emissionInformation.scope3.category2"),
            CsvColumn.of("emissionInformation.scope3.category3").withHeader("emissionInformation.scope3.category3"),
            CsvColumn.of("emissionInformation.scope3.category4").withHeader("emissionInformation.scope3.category4"),
            CsvColumn.of("emissionInformation.scope3.category5").withHeader("emissionInformation.scope3.category5"),
            CsvColumn.of("emissionInformation.scope3.category6").withHeader("emissionInformation.scope3.category6"),
            CsvColumn.of("emissionInformation.scope3.category7").withHeader("emissionInformation.scope3.category7"),
            CsvColumn.of("emissionInformation.scope3.category8").withHeader("emissionInformation.scope3.category8"),
            CsvColumn.of("emissionInformation.scope3.category9").withHeader("emissionInformation.scope3.category9"),
            CsvColumn.of("emissionInformation.scope3.category10").withHeader("emissionInformation.scope3.category10"),
            CsvColumn.of("emissionInformation.scope3.category11").withHeader("emissionInformation.scope3.category11"),
            CsvColumn.of("emissionInformation.scope3.category12").withHeader("emissionInformation.scope3.category12"),
            CsvColumn.of("emissionInformation.scope3.category13").withHeader("emissionInformation.scope3.category13"),
            CsvColumn.of("emissionInformation.scope3.category14").withHeader("emissionInformation.scope3.category14"),
            CsvColumn.of("emissionInformation.scope3.category15").withHeader("emissionInformation.scope3.category15"),
            CsvColumn.of("dpp.name").withHeader("dpp.name"),
            CsvColumn.of("dpp.manufacturer").withHeader("dpp.manufacturer"),
            CsvColumn.of("dpp.serialNumber").withHeader("dpp.serialNumber"),
            CsvColumn.of("dpp.batchNumber").withHeader("dpp.batchNumber"),
            CsvColumn.of("dpp.carbonFootprint.scope1").withHeader("dpp.carbonFootprint.scope1"),
            CsvColumn.of("dpp.carbonFootprint.scope2").withHeader("dpp.carbonFootprint.scope2"),
            CsvColumn.of("dpp.carbonFootprint.scope3").withHeader("dpp.carbonFootprint.scope3")
    );

    this.inputColumns = Arrays.asList(
        CsvColumn.of("id").withHeader("id"),
        CsvColumn.of("product").withHeader("from"),
        CsvColumn.of("productName").withHeader("productName"),
        CsvColumn.of("process").withHeader("to"),
        CsvColumn.of("processName").withHeader("processName")    
        
    );

    this.outputColumns = Arrays.asList(
        CsvColumn.of("id").withHeader("id"),
        CsvColumn.of("process").withHeader("from"),
        CsvColumn.of("processName").withHeader("processName"),
        CsvColumn.of("product").withHeader("to"),
        CsvColumn.of("productName").withHeader("productName")                              
    );
  }
}
