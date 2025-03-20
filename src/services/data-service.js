/**
 * Data Service
 * 
 * This service provides an interface to interact with local CSV data files
 * for testing purposes until the BigQuery integration is fully configured.
 */

const fs = require('fs');
const path = require('path');
const calculatedFieldsService = require('./calculated-fields');

class DataService {
  constructor() {
    this.data = null;
    this.headers = null;
    this.dealerNames = [];
    this.metrics = [];
    this.dataLoaded = false;
  }

  /**
   * Load data from a CSV file
   * @param {string} filePath - Path to the CSV file
   * @returns {Promise<boolean>} - Whether the data was loaded successfully
   */
  async loadData(filePath) {
    try {
      // Read the file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse the CSV data
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      
      // Find the start of the actual data (after the headers)
      let dataStartIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Dealer Legal Name')) {
          dataStartIndex = i;
          break;
        }
      }
      
      console.log(`Found data start at line ${dataStartIndex}: ${lines[dataStartIndex]}`);
      
      // Extract headers
      this.headers = this.parseCSVLine(lines[dataStartIndex]);
      console.log('Parsed headers:', this.headers);
      
      // Extract metrics from headers
      this.metrics = this.headers.slice(1);
      
      // Parse data rows
      this.data = [];
      for (let i = dataStartIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue;
        
        const values = this.parseCSVLine(line);
        if (values.length >= this.headers.length) {
          const row = {};
          row[this.headers[0]] = values[0];
          this.dealerNames.push(values[0]);
          
          for (let j = 1; j < this.headers.length; j++) {
            row[this.headers[j]] = values[j];
          }
          
          this.data.push(row);
        }
      }
      
      this.dataLoaded = true;
      console.log(`Loaded ${this.data.length} rows of data with ${this.metrics.length} metrics`);
      
      // Initialize calculated fields
      calculatedFieldsService.initializeDefaultFields(this.headers);
      
      return true;
    } catch (error) {
      console.error('Error loading data:', error);
      return false;
    }
  }

  /**
   * Parse a CSV line, handling quoted values
   * @param {string} line - CSV line to parse
   * @returns {Array<string>} - Array of values
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Get all available dealer names
   * @returns {Array<string>} - Array of dealer names
   */
  getDealerNames() {
    if (!this.dataLoaded) {
      throw new Error('Data not loaded. Call loadData() first.');
    }
    return this.dealerNames;
  }

  /**
   * Get all available metrics
   * @returns {Array<string>} - Array of metric names
   */
  getMetrics() {
    if (!this.dataLoaded) {
      throw new Error('Data not loaded. Call loadData() first.');
    }
    return this.metrics;
  }

  /**
   * Get data for a specific dealer
   * @param {string} dealerName - Name of the dealer
   * @returns {Object|null} - Dealer data or null if not found
   */
  getDealerData(dealerName) {
    if (!this.dataLoaded) {
      throw new Error('Data not loaded. Call loadData() first.');
    }
    
    return this.data.find(row => row[this.headers[0]] === dealerName) || null;
  }

  /**
   * Get data for all dealers for a specific metric
   * @param {string} metric - Name of the metric
   * @returns {Array<Object>} - Array of dealer data for the metric
   */
  getMetricData(metric) {
    if (!this.dataLoaded) {
      throw new Error('Data not loaded. Call loadData() first.');
    }
    
    if (!this.metrics.includes(metric)) {
      throw new Error(`Metric "${metric}" not found.`);
    }
    
    return this.data.map(row => ({
      dealer: row[this.headers[0]],
      value: row[metric]
    }));
  }

  /**
   * Execute a simple query against the data
   * @param {Object} query - Query parameters
   * @param {string} query.dealer - Dealer name filter (optional)
   * @param {Array<string>} query.metrics - Metrics to include (optional)
   * @param {number} query.limit - Maximum number of results (optional)
   * @returns {Array<Object>} - Query results
   */
  executeQuery(query = {}) {
    if (!this.dataLoaded) {
      throw new Error('Data not loaded. Call loadData() first.');
    }
    
    console.log('Executing query with parameters:', query);
    
    let results = [...this.data];
    
    // Filter by dealer if specified
    if (query.dealer) {
      results = results.filter(row => 
        row[this.headers[0]].toLowerCase().includes(query.dealer.toLowerCase())
      );
    }
    
    // Apply calculated fields
    if (query.calculatedFields && query.calculatedFields.length > 0) {
      results = calculatedFieldsService.applyCalculatedFields(results, query.calculatedFields);
    }
    
    // Select only specified metrics if provided
    if (query.metrics && query.metrics.length > 0) {
      // Check if any of the metrics are calculated fields
      const calculatedMetrics = query.metrics.filter(metric => 
        calculatedFieldsService.isCalculatedField(metric)
      );
      
      // Apply calculated fields if needed
      if (calculatedMetrics.length > 0) {
        results = calculatedFieldsService.applyCalculatedFields(results, calculatedMetrics);
      }
      
      // Filter to only include requested metrics
      results = results.map(row => {
        const newRow = {};
        newRow[this.headers[0]] = row[this.headers[0]];
        
        query.metrics.forEach(metric => {
          if (row[metric] !== undefined) {
            newRow[metric] = row[metric];
          }
        });
        
        return newRow;
      });
    }
    
    // Apply limit if specified
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }
    
    console.log(`Query returned ${results.length} results`);
    return results;
  }
  
  /**
   * Get all available calculated fields
   * @returns {Object} - Object with calculated field names as keys
   */
  getCalculatedFields() {
    return calculatedFieldsService.getCalculatedFields();
  }
  
  /**
   * Register a new calculated field
   * @param {string} name - Name of the calculated field
   * @param {Function} formula - Function to calculate the field value
   * @param {string} description - Description of the calculated field
   */
  registerCalculatedField(name, formula, description) {
    return calculatedFieldsService.registerCalculatedField(name, formula, description);
  }
}

// Export a singleton instance
const dataService = new DataService();
module.exports = dataService;
