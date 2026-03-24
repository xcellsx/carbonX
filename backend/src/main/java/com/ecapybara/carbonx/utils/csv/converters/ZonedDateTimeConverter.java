package com.ecapybara.carbonx.utils.csv.converters;

import com.opencsv.bean.AbstractBeanField;
import com.opencsv.exceptions.CsvConstraintViolationException;
import com.opencsv.exceptions.CsvDataTypeMismatchException;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class ZonedDateTimeConverter extends AbstractBeanField<ZonedDateTime, String> {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");

    @Override
    protected ZonedDateTime convert(String value)
            throws CsvDataTypeMismatchException, CsvConstraintViolationException {

        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return ZonedDateTime.parse(value.trim(), FORMATTER);
        } catch (Exception e) {
            throw new CsvDataTypeMismatchException(value, ZonedDateTime.class, e.getMessage());
        }
    }
}

