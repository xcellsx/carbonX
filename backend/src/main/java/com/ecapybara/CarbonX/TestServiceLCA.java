package com.ecapybara.CarbonX;

import org.openlca.io.ecospold2.input.EcoSpold2Import;

public class TestServiceLCA {
  
  
  EcoSpold2Import es2Import = new EcoSpold2Import(aDatabase);
  es2Import.run(anArrayOfFiles);
  
  //This function aims to test the data manipulation from material databases
  public void testFunction() {
    	
    System.out.println("testing");
  }
}