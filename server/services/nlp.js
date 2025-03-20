/**
 * Enhanced rule-based query parser for demo purposes
 * This replaces the OpenAI-based parser to avoid API key requirements
 * Supports flexible ratio calculations and statistical operations
 * 
 * @param {string} query - The natural language query
 * @returns {Object} Structured query parameters
 */
async function parseQuery(query) {
  try {
    // Convert query to lowercase for easier matching
    const lowerQuery = query.toLowerCase();
    
    // Initialize result object
    const result = {
      intent: "get_metric"
    };
    
    // Check for metrics
    const metrics = [];
    if (lowerQuery.includes("visit") || lowerQuery.includes("traffic")) {
      metrics.push("visits");
    }
    if (lowerQuery.includes("credit card") || lowerQuery.includes("pap") || lowerQuery.includes("addition")) {
      metrics.push("pap_added:credit_card");
    }
    if (lowerQuery.includes("order") || lowerQuery.includes("confirmation") || lowerQuery.includes("mobility")) {
      metrics.push("cse>mobility_sales>order_confirmation");
    }
    
    // Define metric mappings for flexible calculations
    const metricMappings = {
      "credit card": "_1",
      "credit card additions": "_1",
      "additions": "_1",
      "pap": "_1",
      "visits": "_1", // Map visits to _1 column
      "traffic": "_1", // Map traffic to _1 column
      "order confirmation": "_2",
      "orders": "_2",
      "sales": "_2",
      "total sales": "_2" // Map "total sales" to _2 column
    };
    
    // Check for "total sales" or similar phrases
    if (lowerQuery.includes("total sales") || 
        lowerQuery.includes("sales total") || 
        lowerQuery.includes("sales figures") ||
        lowerQuery.includes("sales numbers")) {
      // Add order confirmations as a metric
      if (!metrics.includes("cse>mobility_sales>order_confirmation")) {
        metrics.push("cse>mobility_sales>order_confirmation");
      }
      
      // If this is a top/bottom query, set the sort metric to order confirmations
      if (lowerQuery.includes("top") || lowerQuery.includes("bottom") || 
          lowerQuery.includes("highest") || lowerQuery.includes("lowest")) {
        result.sort = {
          by: "cse>mobility_sales>order_confirmation",
          order: "desc"
        };
      }
    }
    
    // Check for statistical calculation requests
    if (lowerQuery.includes("average") || 
        lowerQuery.includes("mean") || 
        lowerQuery.includes("median") || 
        lowerQuery.includes("standard deviation") || 
        lowerQuery.includes("variance") || 
        lowerQuery.includes("correlation")) {
      
      // Determine the statistical operation
      let operation = "mean"; // Default
      
      if (lowerQuery.includes("median")) {
        operation = "median";
      } else if (lowerQuery.includes("standard deviation") || lowerQuery.includes("std dev")) {
        operation = "standardDeviation";
      } else if (lowerQuery.includes("variance")) {
        operation = "variance";
      } else if (lowerQuery.includes("correlation")) {
        operation = "correlation";
        
        // For correlation, we need two metrics
        let secondMetric = "visits"; // Default second metric
        
        // Try to identify the second metric for correlation
        if (metrics.length >= 2) {
          secondMetric = metrics[1];
        }
        
        result.calculate = {
          type: "statistical",
          operation: operation,
          metric: metrics[0] || "pap_added:credit_card",
          secondMetric: secondMetric
        };
      } else {
        // For other statistical operations
        result.calculate = {
          type: "statistical",
          operation: operation,
          metric: metrics[0] || "pap_added:credit_card"
        };
      }
      
      // Make sure the metric is included
      if (result.calculate && result.calculate.metric && !metrics.includes(result.calculate.metric)) {
        metrics.push(result.calculate.metric);
      }
      if (result.calculate && result.calculate.secondMetric && !metrics.includes(result.calculate.secondMetric)) {
        metrics.push(result.calculate.secondMetric);
      }
    }
    // Check for ratio/calculation requests
    else if (lowerQuery.includes("ratio") || 
        lowerQuery.includes("divide") || 
        lowerQuery.includes("per") || 
        lowerQuery.match(/([a-z\s]+)\s+by\s+([a-z\s]+)/)) {
      
      // Initialize default metrics
      let numerator = "pap_added:credit_card";
      let denominator = "visits";
      
      // Try to extract the specific metrics mentioned
      // Pattern: "ratio of X to Y" or "X divided by Y" or "X per Y" or "X by Y"
      const ratioPattern1 = /ratio\s+of\s+([a-z\s]+)\s+to\s+([a-z\s]+)/i;
      const ratioPattern2 = /([a-z\s]+)\s+divided\s+by\s+([a-z\s]+)/i;
      const ratioPattern3 = /([a-z\s]+)\s+per\s+([a-z\s]+)/i;
      const ratioPattern4 = /([a-z\s]+)\s+by\s+([a-z\s]+)/i;
      
      let match = lowerQuery.match(ratioPattern1) || 
                  lowerQuery.match(ratioPattern2) || 
                  lowerQuery.match(ratioPattern3) || 
                  lowerQuery.match(ratioPattern4);
      
      if (match) {
        // Extract the metric names from the query
        const numeratorText = match[1].trim();
        const denominatorText = match[2].trim();
        
        // Try to map the extracted terms to actual metrics
        Object.keys(metricMappings).forEach(term => {
          if (numeratorText.includes(term)) {
            numerator = metricMappings[term];
          }
          if (denominatorText.includes(term)) {
            denominator = metricMappings[term];
          }
        });
      }
      
      result.calculate = {
        operation: "ratio",
        numerator: numerator,
        denominator: denominator
      };
      
      // Make sure both metrics are included
      if (!metrics.includes(numerator)) metrics.push(numerator);
      if (!metrics.includes(denominator)) metrics.push(denominator);
    }
    
    // If no specific metrics mentioned, include all
    if (metrics.length === 0) {
      metrics.push("visits", "pap_added:credit_card", "cse>mobility_sales>order_confirmation");
    }
    result.metrics = metrics;
    
    // Check for specific sales rep - but avoid matching phrases like "each rep" or "every rep"
    const excludePatterns = ["each", "every", "all", "these"];
    const salesRepMatch = lowerQuery.match(/for\s+([a-z0-9_\s&.]+)/) || 
                          lowerQuery.match(/about\s+([a-z0-9_\s&.]+)/);
    
    if (salesRepMatch) {
      const matchedText = salesRepMatch[1].trim();
      // Only set as filter if it's not one of the exclude patterns
      if (!excludePatterns.some(pattern => matchedText.includes(pattern))) {
        result.filters = {
          salesRep: matchedText
        };
      }
    }
    
    // Check for top/bottom intent
    if (lowerQuery.includes("top") || lowerQuery.includes("highest") || lowerQuery.includes("most")) {
      result.intent = "find_top";
      
      // Determine sort metric
      let sortBy = "visits"; // Default
      if (lowerQuery.includes("credit card") || lowerQuery.includes("pap") || lowerQuery.includes("addition")) {
        sortBy = "pap_added:credit_card";
      } else if (lowerQuery.includes("order") || lowerQuery.includes("confirmation")) {
        sortBy = "cse>mobility_sales>order_confirmation";
      }
      
      // If calculating ratio, sort by that
      if (result.calculate && result.calculate.operation === "ratio") {
        sortBy = "calculated_ratio";
      }
      
      // If calculating statistics, no need to sort
      if (result.calculate && result.calculate.type === "statistical") {
        // Don't change the sort for statistical calculations
      }
      
      result.sort = {
        by: sortBy,
        order: "desc"
      };
      
      // Check for limit
      const limitMatch = lowerQuery.match(/top\s+(\d+)/) || lowerQuery.match(/(\d+)\s+sales/);
      if (limitMatch) {
        result.limit = parseInt(limitMatch[1]);
      } else {
        result.limit = 5; // Default limit
      }
    }
    
    // Check for bottom/lowest intent
    if (lowerQuery.includes("bottom") || lowerQuery.includes("lowest") || lowerQuery.includes("least")) {
      result.intent = "find_bottom";
      
      // Determine sort metric
      let sortBy = "visits"; // Default
      if (lowerQuery.includes("credit card") || lowerQuery.includes("pap") || lowerQuery.includes("addition")) {
        sortBy = "pap_added:credit_card";
      } else if (lowerQuery.includes("order") || lowerQuery.includes("confirmation")) {
        sortBy = "cse>mobility_sales>order_confirmation";
      }
      
      // If calculating ratio, sort by that
      if (result.calculate && result.calculate.operation === "ratio") {
        sortBy = "calculated_ratio";
      }
      
      // If calculating statistics, no need to sort
      if (result.calculate && result.calculate.type === "statistical") {
        // Don't change the sort for statistical calculations
      }
      
      result.sort = {
        by: sortBy,
        order: "asc"
      };
      
      // Check for limit
      const limitMatch = lowerQuery.match(/bottom\s+(\d+)/) || lowerQuery.match(/(\d+)\s+sales/);
      if (limitMatch) {
        result.limit = parseInt(limitMatch[1]);
      } else {
        result.limit = 5; // Default limit
      }
    }
    
    // Check for compare intent or top and bottom in the same query
    if (lowerQuery.includes("compare")) {
      result.intent = "compare";
      result.limit = 10; // Show more results for comparison
    }
    
    // Check for top and bottom in the same query
    if ((lowerQuery.includes("top") || lowerQuery.includes("highest")) && 
        (lowerQuery.includes("bottom") || lowerQuery.includes("lowest"))) {
      result.intent = "compare_top_bottom";
      
      // Determine sort metric
      let sortBy = "visits"; // Default
      if (lowerQuery.includes("credit card") || lowerQuery.includes("pap") || lowerQuery.includes("addition")) {
        sortBy = "pap_added:credit_card";
      } else if (lowerQuery.includes("order") || lowerQuery.includes("confirmation")) {
        sortBy = "cse>mobility_sales>order_confirmation";
      }
      
      // If calculating ratio, sort by that
      if (result.calculate && result.calculate.operation === "ratio") {
        sortBy = "calculated_ratio";
      }
      
      result.sort = {
        by: sortBy,
        order: "desc" // Default for top results
      };
      
      // Check for limit for top/bottom
      let topBottomLimit = 3; // Default
      const topLimitMatch = lowerQuery.match(/top\s+(\d+)/) || lowerQuery.match(/(\d+)\s+top/);
      const bottomLimitMatch = lowerQuery.match(/bottom\s+(\d+)/) || lowerQuery.match(/(\d+)\s+bottom/);
      
      if (topLimitMatch) {
        topBottomLimit = parseInt(topLimitMatch[1]);
      } else if (bottomLimitMatch) {
        topBottomLimit = parseInt(bottomLimitMatch[1]);
      }
      
      result.topBottomLimit = topBottomLimit;
    }
    
    // Check for "all" or "every" to include all reps
    if (lowerQuery.includes("all reps") || 
        lowerQuery.includes("every rep") || 
        lowerQuery.includes("each rep") ||
        lowerQuery.includes("all sales") || 
        lowerQuery.includes("every sales")) {
      result.includeAll = true;
      result.limit = 100; // Increase limit to show more results
    }
    
    console.log("Parsed query:", result);
    return result;
  } catch (error) {
    console.error('Error in rule-based query parsing:', error);
    throw new Error(`Failed to parse query: ${error.message}`);
  }
}

module.exports = {
  parseQuery
};
