package com.carbonx.smpc;

import java.util.Arrays;
import java.util.List;

public class SecureAggregator {
    public static void main(String[] args) {
        List<Double> inputs = Arrays.asList(10.5, 5.5, 3.0);
        double sum = inputs.stream().mapToDouble(Double::doubleValue).sum();
        System.out.println("{\"aggregated_sum\": " + sum + "}");
    }
}
