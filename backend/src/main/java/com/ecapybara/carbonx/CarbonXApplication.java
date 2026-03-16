package com.ecapybara.carbonx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

import com.ecapybara.carbonx.runner.*;

//import com.ecapybara.CarbonX.runner.*;

@SpringBootApplication
public class CarbonXApplication {

	public static void main(String[] args) {
		Class<?>[] runner = new Class<?>[]{
			// OldSetup.class,
			// UnstableTestSetup.class,
			 StableTestSetup.class,
			// InitialSetup.class,
			CarbonXApplication.class
		};
		// System.exit(SpringApplication.exit(SpringApplication.run(runner, args)));

		ApplicationContext context = SpringApplication.run(runner, args);
	}
}