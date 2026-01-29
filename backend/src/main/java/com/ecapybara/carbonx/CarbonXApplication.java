package com.ecapybara.carbonx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.ecapybara.carbonx.runner.TestSetup;

//import com.ecapybara.CarbonX.runner.*;

@SpringBootApplication
public class CarbonXApplication {

	public static void main(String[] args) {
		Class<?>[] runner = new Class<?>[]{
			TestSetup.class,
			CarbonXApplication.class
		};
		// System.exit(SpringApplication.exit(SpringApplication.run(runner, args)));

		SpringApplication.run(runner, args);
	}
}