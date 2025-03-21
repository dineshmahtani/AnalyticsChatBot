const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const ss = require('simple-statistics');

// Path to the data file
const DATA_FILE = path.join(__dirname, '../../data/Dealer MSS (Copy)_Dinesh (Copy) - TELUS Global Production - Mar 20, 2025.csv');

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
    let salesRepHeader = '';
    
    createReadStream(DATA_FILE)
      .pipe(csv())
      .on('headers', (headerList) => {
        headers = headerList;
        console.log('CSV Headers:', headerList);
      })
      .on('data', (data) => {
        // Debug: Log the first row of data
        if (results.length === 0) {
          console.log('First row of data:', data);
        }
        
        // Skip header rows and empty rows
        if (Object.values(data).some(val => val.includes('Dealer Legal Name'))) {
          salesRepHeader = Object.keys(data).find(key => data[key].includes('Dealer Legal Name'));
          console.log('Found salesRepHeader:', salesRepHeader);
          headerRow = true;
          isDataSection = true;
          return;
        }
        
        if (!isDataSection || headerRow) {
          headerRow = false;
          return;
        }
        
        // Process only rows that have sales rep names
        const salesRep = data[salesRepHeader];
        if (salesRep && !salesRep.startsWith('#') && !salesRep.includes('Dealer Legal Name')) {
          // Extract metrics
          const metrics = {};
          
          // Debug: Log the data object for this row
          console.log('Processing row for salesRep:', salesRep);
          console.log('Data object keys:', Object.keys(data));
          
          Object.keys(data).forEach(key => {
            if (key !== salesRepHeader && data[key]) {
              // Try to convert to number if possible
              const value = !isNaN(data[key]) ? Number(data[key]) : data[key];
              console.log(`Key: ${key}, Value: ${value}`);
              
          // Map the column names to the actual metric names
          if (key === '_1') {
            metrics['Unique Visitors'] = value;
          } else if (key === '_2' || key === '_3') {
            metrics['Visits'] = value;
          } else if (key === '_4') {
            metrics['cse>mobility_sales>getting_started'] = value;
          } else if (key === '_5') {
            metrics['cse>mobility_sales>product_inventory'] = value;
          } else if (key === '_6') {
            metrics['pap_added:credit_card'] = value;
          } else if (key === '_7') {
            metrics['cse>mobility_sales>order_confirmation'] = value;
          } else {
            metrics[key] = value;
          }
            }
          });
          
          // Debug: Log the metrics object
          console.log('Metrics object:', metrics);
          
          results.push({
            salesRep: salesRep,
            ...metrics
          });
        }
      })
      .on('end', () => {
        // Debug: Log the first result
        if (results.length > 0) {
          console.log('First result:', results[0]);
        }
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
    const metrics = Object.keys(firstRow).filter(key => key !== 'salesRep');
    
    return {
      metrics,
      dimensions: ['salesRep']
    };
  } catch (error) {
    console.error('Error getting metadata:', error);
    throw error;
  }
}

/**
 * Helper function to find the closest matching metric
 * @param {Object} item - Data item
 * @param {string} metricName - Metric name to find
 * @returns {string|null} Matching metric key or null if not found
 */
function findClosestMetricMatch(item, metricName) {
  // Define mappings from NLP metric names to actual column names
  const metricMappings = {
    "unique_visitors": "Unique Visitors",
    "visits": "Visits",
    "getting_started": "cse>mobility_sales>getting_started",
    "product_inventory": "cse>mobility_sales>product_inventory",
    "credit_card": "pap_added:credit_card",
    "order_confirmation": "cse>mobility_sales>order_confirmation"
  };
  
  // First try exact match with the item keys
  if (item[metricName] !== undefined) {
    return metricName;
  }
  
  // Check if the metricName is one of our known metrics (case insensitive)
  const knownMetrics = [
    "Unique Visitors",
    "Visits",
    "cse>mobility_sales>getting_started",
    "cse>mobility_sales>product_inventory",
    "pap_added:credit_card",
    "cse>mobility_sales>order_confirmation"
  ];
  
  for (const metric of knownMetrics) {
    if (metricName.toLowerCase() === metric.toLowerCase() && item[metric] !== undefined) {
      return metric;
    }
  }
  
  // Check if we have a direct mapping
  if (metricMappings[metricName] && item[metricMappings[metricName]] !== undefined) {
    return metricMappings[metricName];
  }
  
  // Then try partial match
  return Object.keys(item).find(key => 
    key.toLowerCase().includes(metricName.toLowerCase())
  );
}

/**
 * Format a metric name for display
 * @param {string} metricKey - The metric key
 * @returns {string} Formatted metric name
 */
function formatMetricName(metricKey) {
  // Map column names to display names
  const displayNames = {
    "Unique Visitors": "Unique Visitors",
    "Visits": "Total Visits",
    "cse>mobility_sales>getting_started": "Getting Started Page Visits",
    "cse>mobility_sales>product_inventory": "Product Inventory Page Visits",
    "pap_added:credit_card": "Credit Card Additions",
    "cse>mobility_sales>order_confirmation": "Order Confirmations",
    "﻿#=================================================================": "Sales Representative"
  };
  
  // Check if we have a display name mapping
  if (displayNames[metricKey]) {
    return displayNames[metricKey];
  }
  
  // Default formatting for other metrics
  return metricKey
    .replace(/_/g, ' ')
    .replace(/>/g, ' - ')
    .replace(/\b\w/g, c => c.toUpperCase());
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
      if (parsedQuery.filters.salesRep) {
        const salesRepFilter = parsedQuery.filters.salesRep.toLowerCase();
        filteredData = filteredData.filter(item => 
          item.salesRep.toLowerCase().includes(salesRepFilter)
        );
      }
      
      // Apply other filters if needed
    }
    
    // Handle statistical calculations on ratios
    if (parsedQuery.calculate && parsedQuery.calculate.type === "statistical_ratio") {
      const operation = parsedQuery.calculate.operation;
      const numerator = parsedQuery.calculate.numerator;
      const denominator = parsedQuery.calculate.denominator;
      
      // First calculate the ratio for each item
      const ratioValues = filteredData.map(item => {
        const numeratorKey = findClosestMetricMatch(item, numerator);
        const denominatorKey = findClosestMetricMatch(item, denominator);
        
        if (numeratorKey && denominatorKey && item[denominatorKey] !== 0) {
          return item[numeratorKey] / item[denominatorKey];
        }
        return null;
      }).filter(value => value !== null);
      
      // Calculate the statistical measure on the ratio values
      let statResult;
      let statDescription = '';
      
      switch (operation) {
        case "mean":
          statResult = ss.mean(ratioValues);
          statDescription = `The average ratio of ${formatMetricName(numerator)} to ${formatMetricName(denominator)} across all ${ratioValues.length} sales reps is ${statResult.toFixed(4)}.`;
          break;
        case "median":
          statResult = ss.median(ratioValues);
          statDescription = `The median ratio of ${formatMetricName(numerator)} to ${formatMetricName(denominator)} across all ${ratioValues.length} sales reps is ${statResult.toFixed(4)}.`;
          break;
        case "standardDeviation":
          statResult = ss.standardDeviation(ratioValues);
          statDescription = `The standard deviation of the ratio of ${formatMetricName(numerator)} to ${formatMetricName(denominator)} is ${statResult.toFixed(4)}, indicating the typical variation from the average.`;
          break;
        case "variance":
          statResult = ss.variance(ratioValues);
          statDescription = `The variance of the ratio of ${formatMetricName(numerator)} to ${formatMetricName(denominator)} is ${statResult.toFixed(4)}.`;
          break;
        default:
          statResult = ss.mean(ratioValues);
          statDescription = `The average ratio of ${formatMetricName(numerator)} to ${formatMetricName(denominator)} is ${statResult.toFixed(4)}.`;
      }
      
      // Calculate the ratio for each item to include in the results
      const resultsWithRatio = filteredData.slice(0, 10).map(item => {
        const result = { salesRep: item.salesRep };
        
        // Include the original metrics
        const numeratorKey = findClosestMetricMatch(item, numerator);
        const denominatorKey = findClosestMetricMatch(item, denominator);
        
        if (numeratorKey) {
          result[numeratorKey] = item[numeratorKey];
        }
        if (denominatorKey) {
          result[denominatorKey] = item[denominatorKey];
        }
        
        // Calculate the ratio
        if (numeratorKey && denominatorKey && item[denominatorKey] !== 0) {
          const ratio = item[numeratorKey] / item[denominatorKey];
          result.calculated_ratio = parseFloat(ratio.toFixed(4));
          result.ratio_label = `${formatMetricName(numeratorKey)} per ${formatMetricName(denominatorKey)}`;
        } else {
          result.calculated_ratio = null;
          result.ratio_label = `${formatMetricName(numeratorKey)} per ${formatMetricName(denominatorKey)} (N/A)`;
        }
        
        return result;
      });
      
      // Return the statistical result with the ratio data
      return {
        query: parsedQuery,
        results: resultsWithRatio,
        statistics: {
          operation: operation,
          numerator: numerator,
          denominator: denominator,
          value: statResult,
          description: statDescription,
          sampleSize: ratioValues.length
        }
      };
    }
    // Handle regular statistical calculations
    else if (parsedQuery.calculate && parsedQuery.calculate.type === "statistical") {
      const operation = parsedQuery.calculate.operation;
      const metric = parsedQuery.calculate.metric;
      
      // Extract the values for the specified metric
      const metricValues = filteredData.map(item => {
        const metricKey = findClosestMetricMatch(item, metric);
        return metricKey ? item[metricKey] : null;
      }).filter(value => value !== null);
      
      // Calculate the statistical measure
      let statResult;
      let statDescription = '';
      
      switch (operation) {
        case "mean":
          statResult = ss.mean(metricValues);
          statDescription = `The average ${formatMetricName(metric)} across all ${metricValues.length} sales reps is ${statResult.toFixed(2)}.`;
          break;
        case "median":
          statResult = ss.median(metricValues);
          statDescription = `The median ${formatMetricName(metric)} across all ${metricValues.length} sales reps is ${statResult.toFixed(2)}.`;
          break;
        case "standardDeviation":
          statResult = ss.standardDeviation(metricValues);
          statDescription = `The standard deviation of ${formatMetricName(metric)} is ${statResult.toFixed(2)}, indicating the typical variation from the average.`;
          break;
        case "variance":
          statResult = ss.variance(metricValues);
          statDescription = `The variance of ${formatMetricName(metric)} is ${statResult.toFixed(2)}.`;
          break;
        case "correlation":
          // For correlation, we need two metrics
          const secondMetric = parsedQuery.calculate.secondMetric;
          const secondMetricValues = filteredData.map(item => {
            const metricKey = findClosestMetricMatch(item, secondMetric);
            return metricKey ? item[metricKey] : null;
          }).filter(value => value !== null);
          
          // Filter out null values and ensure arrays are the same length
          const validPairs = filteredData
            .map(item => {
              const firstKey = findClosestMetricMatch(item, metric);
              const secondKey = findClosestMetricMatch(item, secondMetric);
              if (firstKey && secondKey && item[firstKey] !== null && item[secondKey] !== null) {
                return {
                  first: item[firstKey],
                  second: item[secondKey]
                };
              }
              return null;
            })
            .filter(pair => pair !== null);
          
          const firstValues = validPairs.map(pair => pair.first);
          const secondValues = validPairs.map(pair => pair.second);
          
          if (firstValues.length > 1 && secondValues.length > 1) {
            statResult = ss.sampleCorrelation(firstValues, secondValues);
            
            let correlationStrength = "no";
            let correlationDirection = "correlation";
            
            if (Math.abs(statResult) > 0.7) {
              correlationStrength = "a strong";
            } else if (Math.abs(statResult) > 0.3) {
              correlationStrength = "a moderate";
            } else if (Math.abs(statResult) > 0.1) {
              correlationStrength = "a weak";
            }
            
            if (statResult > 0) {
              correlationDirection = "positive correlation";
            } else if (statResult < 0) {
              correlationDirection = "negative correlation";
            }
            
            statDescription = `There is ${correlationStrength} ${correlationDirection} (${statResult.toFixed(4)}) between ${formatMetricName(metric)} and ${formatMetricName(secondMetric)}.`;
          } else {
            statResult = null;
            statDescription = "Not enough data points to calculate correlation.";
          }
          break;
        default:
          statResult = ss.mean(metricValues); // Default to mean
          statDescription = `The average ${formatMetricName(metric)} is ${statResult.toFixed(2)}.`;
      }
      
      // Return the statistical result
      return {
        query: parsedQuery,
        results: filteredData.slice(0, 10), // Include some sample data
        statistics: {
          operation: operation,
          metric: metric,
          secondMetric: parsedQuery.calculate.secondMetric,
          value: statResult,
          description: statDescription,
          sampleSize: metricValues.length
        }
      };
    }
    
    // Select metrics
    let selectedData = filteredData;
    if (parsedQuery.metrics && parsedQuery.metrics.length > 0) {
      selectedData = filteredData.map(item => {
        const result = { salesRep: item.salesRep };
        parsedQuery.metrics.forEach(metric => {
          // Find the closest matching metric
          const metricKey = findClosestMetricMatch(item, metric);
          
          if (metricKey) {
            result[metricKey] = item[metricKey];
          }
        });
        
        // Calculate ratios if requested
        if (parsedQuery.calculate && parsedQuery.calculate.operation === "ratio") {
          // Special case for the specific query we're trying to support
          if (parsedQuery.metrics.includes("cse>mobility_sales>order_confirmation") && 
              parsedQuery.metrics.includes("Unique Visitors")) {
            // Use order confirmation and unique visitors for the ratio
            const numeratorKey = "cse>mobility_sales>order_confirmation";
            const denominatorKey = "Unique Visitors";
            
            if (item[denominatorKey] !== 0) {
              const ratio = item[numeratorKey] / item[denominatorKey];
              result.calculated_ratio = parseFloat(ratio.toFixed(4)); // Round to 4 decimal places
              result.ratio_label = `Order Confirmations per Unique Visitor`;
            } else {
              // Handle division by zero
              result.calculated_ratio = null;
              result.ratio_label = `Order Confirmations per Unique Visitor (N/A - division by zero)`;
            }
          } else {
            // Default behavior
            const numeratorKey = findClosestMetricMatch(item, parsedQuery.calculate.numerator);
            const denominatorKey = findClosestMetricMatch(item, parsedQuery.calculate.denominator);
            
            if (numeratorKey && denominatorKey && item[denominatorKey] !== 0) {
              const ratio = item[numeratorKey] / item[denominatorKey];
              result.calculated_ratio = parseFloat(ratio.toFixed(4)); // Round to 4 decimal places
              result.ratio_label = `${formatMetricName(numeratorKey)} per ${formatMetricName(denominatorKey)}`;
            } else if (numeratorKey && denominatorKey && item[denominatorKey] === 0) {
              // Handle division by zero
              result.calculated_ratio = null;
              result.ratio_label = `${formatMetricName(numeratorKey)} per ${formatMetricName(denominatorKey)} (N/A - division by zero)`;
            }
          }
        }
        
        return result;
      });
    }
    
    // Sort results if needed
    if (parsedQuery.sort && parsedQuery.sort.by) {
      const sortMetric = parsedQuery.sort.by;
      const sortOrder = parsedQuery.sort.order || 'desc';
      
      selectedData.sort((a, b) => {
        let valueA, valueB;
        
        // Special handling for calculated ratio
        if (sortMetric === 'calculated_ratio') {
          valueA = a.calculated_ratio || 0;
          valueB = b.calculated_ratio || 0;
        } else {
          // Find the closest matching metric for sorting
          const metricKeyA = Object.keys(a).find(key => 
            key.toLowerCase().includes(sortMetric.toLowerCase())
          );
          
          if (!metricKeyA) return 0;
          
          valueA = a[metricKeyA];
          valueB = b[metricKeyA];
        }
        
        if (sortOrder.toLowerCase() === 'asc') {
          return valueA - valueB;
        } else {
          return valueB - valueA;
        }
      });
    }
    
    // Handle compare_top_bottom intent
    if (parsedQuery.intent === "compare_top_bottom") {
      // Sort data for top results (descending)
      const sortMetric = parsedQuery.sort.by;
      const topLimit = parsedQuery.topBottomLimit || 3;
      
      // Create a copy of the data for sorting
      const allData = [...selectedData];
      
      // Sort for top results (descending)
      const topResults = [...allData].sort((a, b) => {
        let valueA, valueB;
        
        // Special handling for calculated ratio
        if (sortMetric === 'calculated_ratio') {
          valueA = a.calculated_ratio || 0;
          valueB = b.calculated_ratio || 0;
        } else {
          // Find the closest matching metric for sorting
          const metricKeyA = Object.keys(a).find(key => 
            key.toLowerCase().includes(sortMetric.toLowerCase())
          );
          
          if (!metricKeyA) return 0;
          
          valueA = a[metricKeyA];
          valueB = b[metricKeyA];
        }
        
        return valueB - valueA; // Descending order for top
      }).slice(0, topLimit);
      
      // Sort for bottom results (ascending)
      const bottomResults = [...allData].sort((a, b) => {
        let valueA, valueB;
        
        // Special handling for calculated ratio
        if (sortMetric === 'calculated_ratio') {
          valueA = a.calculated_ratio || 0;
          valueB = b.calculated_ratio || 0;
        } else {
          // Find the closest matching metric for sorting
          const metricKeyA = Object.keys(a).find(key => 
            key.toLowerCase().includes(sortMetric.toLowerCase())
          );
          
          if (!metricKeyA) return 0;
          
          valueA = a[metricKeyA];
          valueB = b[metricKeyA];
        }
        
        return valueA - valueB; // Ascending order for bottom
      }).slice(0, topLimit);
      
      // Return both top and bottom results
      return {
        query: parsedQuery,
        topResults: topResults,
        bottomResults: bottomResults,
        combinedResults: true
      };
    }
    // Apply limit if specified
    else if (parsedQuery.limit && !isNaN(parsedQuery.limit)) {
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

/**
 * Generate a human-readable interpretation of the parsed query
 * @param {Object} parsedQuery - The parsed query parameters
 * @returns {string} Human-readable interpretation
 */
function generateQueryInterpretation(parsedQuery) {
  let interpretation = "";
  
  // Interpret the intent
  if (parsedQuery.intent === "get_metric") {
    interpretation = "get metrics";
  } else if (parsedQuery.intent === "find_top") {
    interpretation = `find top ${parsedQuery.limit || 5} results`;
  } else if (parsedQuery.intent === "find_bottom") {
    interpretation = `find bottom ${parsedQuery.limit || 5} results`;
  } else if (parsedQuery.intent === "compare_top_bottom") {
    interpretation = `compare top and bottom ${parsedQuery.topBottomLimit || 3} results`;
  } else if (parsedQuery.intent === "compare") {
    interpretation = "compare metrics";
  }
  
  // Add calculation interpretation
  if (parsedQuery.calculate) {
    if (parsedQuery.calculate.type === "statistical") {
      const operation = parsedQuery.calculate.operation;
      const metric = formatMetricName(parsedQuery.calculate.metric);
      
      if (operation === "correlation") {
        const secondMetric = formatMetricName(parsedQuery.calculate.secondMetric);
        interpretation += ` with correlation between ${metric} and ${secondMetric}`;
      } else {
        interpretation += ` with ${operation} of ${metric}`;
      }
    } else if (parsedQuery.calculate.type === "statistical_ratio") {
      const operation = parsedQuery.calculate.operation;
      const numerator = formatMetricName(parsedQuery.calculate.numerator);
      const denominator = formatMetricName(parsedQuery.calculate.denominator);
      
      interpretation += ` with ${operation} of the ratio of ${numerator} to ${denominator}`;
    } else if (parsedQuery.calculate.operation === "ratio") {
      const numerator = formatMetricName(parsedQuery.calculate.numerator);
      const denominator = formatMetricName(parsedQuery.calculate.denominator);
      
      interpretation += ` with ratio of ${numerator} to ${denominator}`;
    }
  }
  
  // Add filter interpretation
  if (parsedQuery.filters && parsedQuery.filters.salesRep) {
    interpretation += ` for sales rep "${parsedQuery.filters.salesRep}"`;
  }
  
  // Add "whole dataset" context if no filters and not top/bottom
  if ((!parsedQuery.filters || Object.keys(parsedQuery.filters).length === 0) && 
      parsedQuery.intent === "get_metric" &&
      (!parsedQuery.limit || parsedQuery.limit > 20)) {
    interpretation += " across the whole dataset";
  }
  
  return interpretation;
}

module.exports = {
  loadData,
  getMetadata,
  executeQuery,
  generateQueryInterpretation
};
