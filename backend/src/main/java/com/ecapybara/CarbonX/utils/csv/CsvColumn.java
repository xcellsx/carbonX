package com.ecapybara.carbonx.utils.csv;
// All credits to code author `carlocarlen`: https://github.com/carlocarlen/export-bean-to-csv/blob/master/src/main/java/dev/carlocarlen/supercsv/service/CsvColumn.java

import org.supercsv.cellprocessor.ift.CellProcessor;

/**
 * Wrapper class to group all settings of a CSV Column.
 * To avoid dealing with arrays CellProcessor, FieldMapping and Headers
 * and the risk of swapping elements
 */
public class CsvColumn {
    private final String fieldMapping;
    private String header;
    private CellProcessor cellProcessor;

    private CsvColumn(String fieldMapping) {
        this.fieldMapping = fieldMapping;
        this.header = fieldMapping;
    }

    /**
     * Start from this call to create a CsvColumn
     * @param fieldMapping required, the name of the field to print.
     *                     Follow Dozer rules for deep mapping (e.g. address.city) and indexed-based mapping (e.g. addresses[0])
     * @return a CsvColumn. It can be modified with chained calls to {@link #withHeader(String)}  and {@link #withCellProcessor(CellProcessor)}
     */
    public static CsvColumn of(String fieldMapping) {
        return new CsvColumn(fieldMapping);
    }

    /**
     * Set the name that will be printed as column header. Default is the same as fieldMapping.
     */
    public CsvColumn withHeader(String header) {
        this.header = header;
        return this;
    }

    /**
     * Set a CellProcessor for the column. Default is null, which correspond to calling toString.
     */
    public CsvColumn withCellProcessor(CellProcessor cellProcessor) {
        this.cellProcessor = cellProcessor;
        return this;
    }

    public String getFieldMapping() {
        return fieldMapping;
    }

    public String getHeader() {
        return header;
    }

    public CellProcessor getCellProcessor() {
        return cellProcessor;
    }
}
