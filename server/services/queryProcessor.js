const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

// Path to the data file
const DATA_FILE = path.join(__dirname, '../../data/telus_analytics_sample.csv');

/**
 * Load and parse the CSV data
 * @returns {Promise<Array>} Parsed data
 */
async function loadData() {
  return new Promise((resolve, reject) => {
    const results = [];
    let headers = [];
    let isDataSection = false;
    let headerRow = false;
    let dealerNameHeader = '';
    
    createReadStream(DATA_FILE)
      .pipe(csv())
      .on('headers', (headerList) => {
        headers = headerList;
      })
      .on('data', (data) => {
        // Skip header rows and empty rows
        if (Object.values(data).some(val => val.includes('Dealer Legal Name'))) {
          dealerNameHeader = Object.keys(data).find(key => data[key].includes('Dealer Legal Name'));
          headerRow = true;
          isDataSection = true;
          return;
        }
        
        if (!isDataSection || headerRow) {
          headerRow = false;
          return;
        }
        
        // Process only rows that have dealer names
        const dealerName = data[dealerNameHeader];
        if (dealerName && !dealerName.startsWith('#') && !dealerName.includes('Dealer Legal Name')) {
          // Extract metrics
          const metrics = {};
          Object.keys(data).forEach(key => {
            if (key !== dealerNameHeader && data[key]) {
              // Try to convert to number if possible
              const value = !isNaN(data[key]) ? Number(data[key]) : data[key];
              metrics[key] = value;
            }
          });
          
          results.push({
            dealer: dealerName,
            ...metrics
          });
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Get metadata about available metrics and dimensions
 * @returns {Promise<Object>} Metadata
 */
async function getMetadata() {
  try {
    const data = await loadData();
    
    if (data.length === 0) {
      return { metrics: [], dimensions: [] };
    }
    
    // Extract metrics and dimensions from the first data row
    const firstRow = data[0];
    const metrics = Object.keys(firstRow).filter(key => key !== 'dealer');
    
    return {
      metrics,
      dimensions: ['dealer']
    };
  } catch (error) {
    console.error('Error getting metadata:', error);
    throw error;
  }
}

/**
 * Execute a query based on parsed parameters
 * @param {Object} parsedQuery - The parsed query parameters
 * @returns {Promise<Object>} Query results
 */
async function executeQuery(parsedQuery) {
  try {
    const data = await loadData();
    
    if (data.length === 0) {
      return { results: [] };
    }
    
    // Apply filters
    let filteredData = data;
    
    if (parsedQuery.filters) {
      if (parsedQuery.filters.dealer) {
        const dealerFilter = parsedQuery.filters.dealer.toLowerCase();
        filteredData = filteredData.filter(item => 
          item.dealer.toLowerCase().includes(dealerFilter)
        );
      }
      
      // Apply other filters if needed
    }
    
    // Select metrics
    let selectedData = filteredData;
    if (parsedQuery.metrics && parsedQuery.metrics.length > 0) {
      selectedData = filteredData.map(item => {
        const result = { dealer: item.dealer };
        parsedQuery.metrics.forEach(metric => {
          // Find the closest matching metric
          const metricKey = Object.keys(item).find(key => 
            key.toLowerCase().includes(metric.toLowerCase())
          );
          
          if (metricKey) {
            result[metricKey] = item[metricKey];
          }
        });
        return result;
      });
    }
    
    // Sort results if needed
    if (parsedQuery.sort && parsedQuery.sort.by) {
      const sortMetric = parsedQuery.sort.by;
      const sortOrder = parsedQuery.sort.order || 'desc';
      
      selectedData.sort((a, b) => {
        // Find the closest matching metric for sorting
        const metricKeyA = Object.keys(a).find(key => 
          key.toLowerCase().includes(sortMetric.toLowerCase())
        );
        
        if (!metricKeyA) return 0;
        
        const valueA = a[metricKeyA];
        const valueB = b[metricKeyA];
        
        if (sortOrder.toLowerCase() === 'asc') {
          return valueA - valueB;
        } else {
          return valueB - valueA;
        }
      });
    }
    
    // Apply limit if specified
    if (parsedQuery.limit && !isNaN(parsedQuery.limit)) {
      selectedData = selectedData.slice(0, parseInt(parsedQuery.limit));
    }
    
    return {
      query: parsedQuery,
      results: selectedData
    };
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

module.exports = {
  loadData,
  getMetadata,
  executeQuery
};
