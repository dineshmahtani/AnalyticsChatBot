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
  
  if (query.filters && query.filters.dealer) {
    parts.push(`Dealer: ${query.filters.dealer}`);
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
  
  // For specific dealer queries
  else if (query.filters && query.filters.dealer) {
    const dealer = query.filters.dealer;
    summary = `Here are the metrics for ${dealer}:`;
  }
  
  // Default summary
  else {
    summary = `I found ${data.length} results matching your query:`;
  }
  
  return summary;
}

/**
 * Create a natural language explanation of the results
 * @param {Array} data - The results data
 * @param {Object} query - The query object
 * @returns {string} Explanation text
 */
function createResultsExplanation(data, query) {
  if (!data || data.length === 0) return '';
  
  // For top dealer queries
  if (query.intent && query.intent.includes('top') && data.length > 0) {
    const topDealer = data[0].dealer;
    const metric = query.sort && query.sort.by ? query.sort.by : (query.metrics && query.metrics[0]);
    
    if (metric && topDealer) {
      const metricValue = data[0][metric];
      const formattedMetric = metric.includes('pap_added:credit_card') ? 'credit card additions' : metric;
      
      return `<p class="results-explanation">The dealer with the highest ${formattedMetric} is <strong>${topDealer}</strong> with <strong>${metricValue.toLocaleString()}</strong>.</p>`;
    }
  }
  
  return '';
}
