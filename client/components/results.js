/**
 * Format a query interpretation for display
 * @param {Object} query - The parsed query
 * @returns {string} Formatted interpretation text
 */
function formatQueryInterpretation(query) {
  if (!query) return '';
  
  const parts = [];
  
  if (query.intent) {
    parts.push(`Intent: ${query.intent.replace(/_/g, ' ')}`);
  }
  
  if (query.metrics && query.metrics.length) {
    parts.push(`Metrics: ${query.metrics.join(', ')}`);
  }
  
  if (query.filters && query.filters.salesRep) {
    parts.push(`Sales Rep: ${query.filters.salesRep}`);
  }
  
  if (query.limit) {
    parts.push(`Limit: ${query.limit}`);
  }
  
  if (query.sort && query.sort.by) {
    parts.push(`Sort by: ${query.sort.by} (${query.sort.order || 'desc'})`);
  }
  
  return parts.join(' | ') || 'General query about analytics data';
}

/**
 * Create a summary of the results
 * @param {Array} data - The results data
 * @param {Object} query - The query object
 * @returns {string} Summary text
 */
function createResultsSummary(data, query) {
  if (!data || data.length === 0) return '';
  
  let summary = '';
  
  // For top/bottom queries
  if (query.intent && (query.intent.includes('top') || query.intent.includes('bottom'))) {
    const metric = query.sort && query.sort.by ? query.sort.by : (query.metrics && query.metrics[0]);
    const order = query.sort && query.sort.order === 'asc' ? 'lowest' : 'highest';
    
    if (metric) {
      const formattedMetric = metric.includes('pap_added:credit_card') ? 'credit card additions' : metric;
      summary = `Here are the dealers with the ${order} ${formattedMetric}:`;
    }
  }
  
  // For specific sales rep queries
  else if (query.filters && query.filters.salesRep) {
    const salesRep = query.filters.salesRep;
    summary = `Here are the metrics for ${salesRep}:`;
  }
  
  // Default summary
  else {
    summary = `I found ${data.length} results matching your query:`;
  }
  
  return summary;
}

/**
 * Format a metric name for display
 * @param {string} metricKey - The metric key
 * @returns {string} Formatted metric name
 */
function formatMetricName(metricKey) {
  // Map column names to display names
  const displayNames = {
    "_1": "credit card additions",
    "_2": "order confirmations",
    "﻿#=================================================================": "sales representative"
  };
  
  // Check if we have a display name mapping
  if (displayNames[metricKey]) {
    return displayNames[metricKey];
  }
  
  // Default formatting for other metrics
  return metricKey
    .replace(/_/g, ' ')
    .replace(/>/g, ' - ')
    .replace(/:/g, ' ')
    .toLowerCase();
}

/**
 * Create a natural language explanation of the results
 * @param {Array} data - The results data
 * @param {Object} query - The query object
 * @param {Object} statistics - Statistical results if available
 * @param {boolean} combinedResults - Whether this is a combined top/bottom result
 * @param {Array} topResults - Top results if available
 * @param {Array} bottomResults - Bottom results if available
 * @returns {string} Explanation text
 */
function createResultsExplanation(data, query, statistics, combinedResults, topResults, bottomResults) {
  // If we have statistical results, prioritize those
  if (statistics) {
    return `<p class="results-explanation">${statistics.description}</p>`;
  }
  
  // For combined top/bottom results
  if (combinedResults && topResults && bottomResults && 
      topResults.length > 0 && bottomResults.length > 0) {
    
    const metric = query.sort && query.sort.by ? query.sort.by : (query.metrics && query.metrics[0]);
    
    if (metric) {
      let formattedMetric;
      
      if (metric === 'calculated_ratio') {
        // Use the dynamic ratio label if available
        formattedMetric = topResults[0].ratio_label ? 
          topResults[0].ratio_label.toLowerCase() : 
          'ratio of credit card additions per visit';
      } else if (metric.includes('pap_added:credit_card')) {
        formattedMetric = 'credit card additions';
      } else if (metric.includes('cse>mobility_sales>order_confirmation')) {
        formattedMetric = 'order confirmations';
      } else {
        formattedMetric = formatMetricName(metric);
      }
      
      const topSalesRep = topResults[0].salesRep;
      const bottomSalesRep = bottomResults[0].salesRep;
      
      const topValue = metric === 'calculated_ratio' ? 
        topResults[0].calculated_ratio.toFixed(4) : 
        topResults[0][metric].toLocaleString();
        
      const bottomValue = metric === 'calculated_ratio' ? 
        bottomResults[0].calculated_ratio.toFixed(4) : 
        bottomResults[0][metric].toLocaleString();
      
      return `<p class="results-explanation">
        I've found the sales reps with the highest and lowest ${formattedMetric}.<br>
        <strong>${topSalesRep}</strong> has the highest with <strong>${topValue}</strong>, while 
        <strong>${bottomSalesRep}</strong> has the lowest with <strong>${bottomValue}</strong>.
      </p>`;
    }
    
    return `<p class="results-explanation">Here are the sales reps with the highest and lowest values as requested.</p>`;
  }
  
  if (!data || data.length === 0) return '';
  
  // For top sales rep queries
  if (query.intent && query.intent.includes('top') && data.length > 0) {
    const topSalesRep = data[0].salesRep;
    const metric = query.sort && query.sort.by ? query.sort.by : (query.metrics && query.metrics[0]);
    
    if (metric && topSalesRep) {
      // Map metric names to actual column names
      const metricMappings = {
        "visits": "_1", // Map visits to _1 column
        "pap_added:credit_card": "_1", // Map credit card additions to _1 column
        "cse>mobility_sales>order_confirmation": "_2" // Map order confirmations to _2 column
      };
      
      // Find the actual metric key in the data
      let metricKey;
      
      // First check if we have a direct mapping
      if (metricMappings[metric]) {
        metricKey = metricMappings[metric];
      } else {
        // Otherwise try to find it in the data
        metricKey = Object.keys(data[0]).find(key => 
          key === metric || key.toLowerCase().includes(metric.toLowerCase())
        );
      }
      
      // Get the metric value using the found key
      const metricValue = metricKey ? data[0][metricKey] : undefined;
      let formattedMetric;
      let formattedValue;
      
      if (metric === 'calculated_ratio') {
        // Use the dynamic ratio label if available
        formattedMetric = data[0].ratio_label ? 
          data[0].ratio_label.toLowerCase() : 
          'ratio of credit card additions per visit';
        formattedValue = metricValue ? metricValue.toFixed(4) : 'N/A';
      } else if (metric.includes('pap_added:credit_card')) {
        formattedMetric = 'credit card additions';
        formattedValue = metricValue !== undefined ? metricValue.toLocaleString() : 'N/A';
      } else if (metric.includes('cse>mobility_sales>order_confirmation')) {
        formattedMetric = 'order confirmations';
        formattedValue = metricValue !== undefined ? metricValue.toLocaleString() : 'N/A';
      } else {
        formattedMetric = formatMetricName(metric);
        formattedValue = metricValue !== undefined ? 
          (typeof metricValue === 'number' ? metricValue.toLocaleString() : metricValue) : 
          'N/A';
      }
      
      return `<p class="results-explanation">The sales rep with the highest ${formattedMetric} is <strong>${topSalesRep}</strong> with <strong>${formattedValue}</strong>.</p>`;
    }
  }
  
  // For ratio calculations without top/bottom intent
  if (query.calculate && query.calculate.operation === "ratio" && 
      data.length > 0 && data[0].calculated_ratio) {
    return `<p class="results-explanation">I've calculated the ${data[0].ratio_label.toLowerCase()} for each sales rep.</p>`;
  }
  
  return '';
}
