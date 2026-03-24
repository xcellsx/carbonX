package com.ecapybara.carbonx.utils.csv;
// All credits to code author `carlocarlen`: https://github.com/carlocarlen/export-bean-to-csv/blob/master/src/main/java/dev/carlocarlen/supercsv/service/CsvColumn.java

import org.supercsv.cellprocessor.ift.CellProcessor;
import org.supercsv.io.dozer.CsvDozerBeanWriter;

import java.io.IOException;
import java.util.List;

/**
 * Use CsvDozerBeanWriter with a list of CsvColumns, in order to avoid dealing with arrays
 */
public class CsvColumnWriterWithDozer implements AutoCloseable {

    private final List<CsvColumn> csvColumns;
    private final CsvDozerBeanWriter csvDozerBeanWriter;

    public CsvColumnWriterWithDozer(List<CsvColumn> csvColumns, CsvDozerBeanWriter csvDozerBeanWriter, Class<?> clazz) {
        this.csvColumns = csvColumns;
        String[] fieldMappings = csvColumns.stream().map(CsvColumn::getFieldMapping).toArray(String[]::new);
        csvDozerBeanWriter.configureBeanMapping(clazz, fieldMappings);
        this.csvDozerBeanWriter = csvDozerBeanWriter;
    }

    /**
     * Write headers as defined by the CsvColumn list
     */
    public void writeHeaders() throws IOException {
        String[] headers = csvColumns.stream().map(CsvColumn::getHeader).toArray(String[]::new);
        this.csvDozerBeanWriter.writeHeader(headers);
    }

    /**
     * Write bean properties, in correct order and using cell processor as defined by the CsvColumn array
     * @param bean the bean to write
     */
    public void writeBean(Object bean) throws IOException {
        CellProcessor[] cellProcessors = csvColumns.stream().map(CsvColumn::getCellProcessor).toArray(CellProcessor[]::new);
        this.csvDozerBeanWriter.write(bean, cellProcessors);
    }

    public void flush() throws IOException {
        this.csvDozerBeanWriter.flush();
    }

    public void close() throws IOException {
        this.csvDozerBeanWriter.close();
    }
}
