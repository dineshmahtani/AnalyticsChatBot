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
    if (lowerQuery.includes("unique visitor")) {
      metrics.push("Unique Visitors");
    }
    if (lowerQuery.includes("visit") || lowerQuery.includes("traffic")) {
      metrics.push("Visits");
    }
    if (lowerQuery.includes("getting started") || lowerQuery.includes("start page")) {
      metrics.push("cse>mobility_sales>getting_started");
    }
    if (lowerQuery.includes("product inventory") || lowerQuery.includes("inventory page")) {
      metrics.push("cse>mobility_sales>product_inventory");
    }
    if (lowerQuery.includes("credit card") || lowerQuery.includes("pap") || lowerQuery.includes("addition")) {
      metrics.push("pap_added:credit_card");
    }
    if (lowerQuery.includes("order") || lowerQuery.includes("confirmation") || lowerQuery.includes("mobility")) {
      metrics.push("cse>mobility_sales>order_confirmation");
    }
    
    // Define metric mappings for flexible calculations
    const metricMappings = {
      "unique visitors": "Unique Visitors",
      "unique": "Unique Visitors",
      "visitors": "Unique Visitors",
      "visits": "Visits",
      "total visits": "Visits",
      "traffic": "Visits",
      "getting started": "cse>mobility_sales>getting_started",
      "getting started page": "cse>mobility_sales>getting_started",
      "product inventory": "cse>mobility_sales>product_inventory",
      "inventory page": "cse>mobility_sales>product_inventory",
      "credit card": "pap_added:credit_card",
      "credit card additions": "pap_added:credit_card",
      "additions": "pap_added:credit_card",
      "pap": "pap_added:credit_card",
      "order confirmation": "cse>mobility_sales>order_confirmation",
      "orders": "cse>mobility_sales>order_confirmation",
      "sales": "cse>mobility_sales>order_confirmation",
      "total sales": "cse>mobility_sales>order_confirmation"
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
    
    // First check if the query contains both statistical and ratio terms
    const hasStatisticalTerm = lowerQuery.includes("average") || 
                              lowerQuery.includes("mean") || 
                              lowerQuery.includes("median") || 
                              lowerQuery.includes("standard deviation") || 
                              lowerQuery.includes("variance") || 
                              lowerQuery.includes("correlation");
    
    const hasRatioTerm = lowerQuery.includes("ratio") || 
                         lowerQuery.includes("divide") || 
                         lowerQuery.includes("per") || 
                         lowerQuery.match(/([a-z\s]+)\s+by\s+([a-z\s]+)/);
    
    // Check for combined statistical operation on ratio
    if (hasStatisticalTerm && hasRatioTerm) {
      // Determine the statistical operation
      let operation = "mean"; // Default
      
      if (lowerQuery.includes("median")) {
        operation = "median";
      } else if (lowerQuery.includes("standard deviation") || lowerQuery.includes("std dev")) {
        operation = "standardDeviation";
      } else if (lowerQuery.includes("variance")) {
        operation = "variance";
      }
      
      // Extract ratio metrics
      let numerator = "pap_added:credit_card"; // Default
      let denominator = "visits"; // Default
      
      // Try to extract the specific metrics mentioned for the ratio
      const ratioPattern1 = /ratio\s+of\s+([a-z\s>:_]+)\s+to\s+([a-z\s>:_]+)/i;
      const ratioPattern2 = /([a-z\s>:_]+)\s+divided\s+by\s+([a-z\s>:_]+)/i;
      const ratioPattern3 = /([a-z\s>:_]+)\s+per\s+([a-z\s>:_]+)/i;
      const ratioPattern4 = /([a-z\s>:_]+)\s+by\s+([a-z\s>:_]+)/i;
      
      let match = lowerQuery.match(ratioPattern1) || 
                  lowerQuery.match(ratioPattern2) || 
                  lowerQuery.match(ratioPattern3) || 
                  lowerQuery.match(ratioPattern4);
      
      if (match) {
        // Extract the metric names from the query
        const numeratorText = match[1].trim();
        const denominatorText = match[2].trim();
        
        // First check if the extracted terms are exact metric names
        const allMetrics = [
          "Unique Visitors",
          "Visits",
          "cse>mobility_sales>getting_started",
          "cse>mobility_sales>product_inventory",
          "pap_added:credit_card",
          "cse>mobility_sales>order_confirmation"
        ];
        
        // Check for exact matches first (case insensitive)
        allMetrics.forEach(metric => {
          if (numeratorText.toLowerCase() === metric.toLowerCase()) {
            numerator = metric;
          }
          if (denominatorText.toLowerCase() === metric.toLowerCase()) {
            denominator = metric;
          }
        });
        
        // Also check if the extracted terms contain the exact metric names
        allMetrics.forEach(metric => {
          if (numeratorText.toLowerCase().includes(metric.toLowerCase())) {
            numerator = metric;
          }
          if (denominatorText.toLowerCase().includes(metric.toLowerCase())) {
            denominator = metric;
          }
        });
        
        // Apply term mapping for partial matches
        Object.keys(metricMappings).forEach(term => {
          if (numeratorText.includes(term)) {
            numerator = metricMappings[term];
          }
          if (denominatorText.includes(term)) {
            denominator = metricMappings[term];
          }
        });
        
        // Special handling for common terms
        if (numeratorText.includes("order") || numeratorText.includes("confirmation")) {
          numerator = "cse>mobility_sales>order_confirmation";
        }
        if (denominatorText.includes("order") || denominatorText.includes("confirmation")) {
          denominator = "cse>mobility_sales>order_confirmation";
        }
        if (numeratorText.includes("product") || numeratorText.includes("inventory")) {
          numerator = "cse>mobility_sales>product_inventory";
        }
        if (denominatorText.includes("product") || denominatorText.includes("inventory")) {
          denominator = "cse>mobility_sales>product_inventory";
        }
        if (numeratorText.includes("visit") || numeratorText.includes("traffic")) {
          numerator = "Visits";
        }
        if (denominatorText.includes("visit") || denominatorText.includes("traffic")) {
          denominator = "Visits";
        }
      }
      
      // Special case for product inventory and order confirmation
      if ((lowerQuery.includes("product") || lowerQuery.includes("inventory")) && 
          (lowerQuery.includes("order") || lowerQuery.includes("confirmation"))) {
        // Check which one appears first to determine numerator/denominator
        const productIndex = Math.min(
          lowerQuery.indexOf("product") >= 0 ? lowerQuery.indexOf("product") : Infinity,
          lowerQuery.indexOf("inventory") >= 0 ? lowerQuery.indexOf("inventory") : Infinity
        );
        
        const orderIndex = Math.min(
          lowerQuery.indexOf("order") >= 0 ? lowerQuery.indexOf("order") : Infinity,
          lowerQuery.indexOf("confirmation") >= 0 ? lowerQuery.indexOf("confirmation") : Infinity
        );
        
        if (productIndex < orderIndex) {
          numerator = "cse>mobility_sales>product_inventory";
          denominator = "cse>mobility_sales>order_confirmation";
        } else {
          numerator = "cse>mobility_sales>order_confirmation";
          denominator = "cse>mobility_sales>product_inventory";
        }
      }
      
      // Create a combined statistical ratio operation
      result.calculate = {
        type: "statistical_ratio",
        operation: operation,
        numerator: numerator,
        denominator: denominator
      };
      
      // Make sure both metrics are included
      if (!metrics.includes(numerator)) metrics.push(numerator);
      if (!metrics.includes(denominator)) metrics.push(denominator);
    }
    // Check for regular statistical calculation requests (without ratio)
    else if (hasStatisticalTerm) {
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
    // Check for regular ratio/calculation requests (without statistical operation)
    else if (lowerQuery.includes("ratio") || 
        lowerQuery.includes("divide") || 
        lowerQuery.includes("per") || 
        lowerQuery.match(/([a-z\s]+)\s+by\s+([a-z\s]+)/)) {
      
      // Initialize default metrics
      let numerator = "pap_added:credit_card";
      let denominator = "visits";
      
        // Special cases for specific queries with exact metric names
        if (lowerQuery.includes("cse>mobility_sales>order_confirmation") && 
            lowerQuery.includes("cse>mobility_sales>getting_started")) {
          // Check if order_confirmation is the numerator or denominator
          if (lowerQuery.indexOf("cse>mobility_sales>order_confirmation") < lowerQuery.indexOf("cse>mobility_sales>getting_started")) {
            numerator = "cse>mobility_sales>order_confirmation";
            denominator = "cse>mobility_sales>getting_started";
          } else {
            numerator = "cse>mobility_sales>getting_started";
            denominator = "cse>mobility_sales>order_confirmation";
          }
        } else if (lowerQuery.includes("cse>mobility_sales>order_confirmation") && 
            lowerQuery.includes("unique visitors")) {
          numerator = "cse>mobility_sales>order_confirmation";
          denominator = "Unique Visitors";
        } 
        // Special case for order confirmations to visits ratio
        else if ((lowerQuery.includes("order") || lowerQuery.includes("confirmation")) && 
                 (lowerQuery.includes("visit") || lowerQuery.includes("traffic"))) {
          // Check if order/confirmation appears before visit/traffic
          const orderIndex = Math.min(
            lowerQuery.indexOf("order") >= 0 ? lowerQuery.indexOf("order") : Infinity,
            lowerQuery.indexOf("confirmation") >= 0 ? lowerQuery.indexOf("confirmation") : Infinity
          );
          
          const visitIndex = Math.min(
            lowerQuery.indexOf("visit") >= 0 ? lowerQuery.indexOf("visit") : Infinity,
            lowerQuery.indexOf("traffic") >= 0 ? lowerQuery.indexOf("traffic") : Infinity
          );
          
          if (orderIndex < visitIndex) {
            numerator = "cse>mobility_sales>order_confirmation";
            denominator = "Visits";
          } else {
            numerator = "Visits";
            denominator = "cse>mobility_sales>order_confirmation";
          }
      } else {
        // Try to extract the specific metrics mentioned
        // Pattern: "ratio of X to Y" or "X divided by Y" or "X per Y" or "X by Y"
        // Updated to handle full metric names with special characters like >
        const ratioPattern1 = /ratio\s+of\s+([a-z\s>:_]+)\s+to\s+([a-z\s>:_]+)/i;
        const ratioPattern2 = /([a-z\s>:_]+)\s+divided\s+by\s+([a-z\s>:_]+)/i;
        const ratioPattern3 = /([a-z\s>:_]+)\s+per\s+([a-z\s>:_]+)/i;
        const ratioPattern4 = /([a-z\s>:_]+)\s+by\s+([a-z\s>:_]+)/i;
        
        let match = lowerQuery.match(ratioPattern1) || 
                    lowerQuery.match(ratioPattern2) || 
                    lowerQuery.match(ratioPattern3) || 
                    lowerQuery.match(ratioPattern4);
        
        if (match) {
          // Extract the metric names from the query
          const numeratorText = match[1].trim();
          const denominatorText = match[2].trim();
          
          // First check if the extracted terms are exact metric names
          const allMetrics = [
            "Unique Visitors",
            "Visits",
            "cse>mobility_sales>getting_started",
            "cse>mobility_sales>product_inventory",
            "pap_added:credit_card",
            "cse>mobility_sales>order_confirmation"
          ];
          
          // Check for exact matches first (case insensitive)
          allMetrics.forEach(metric => {
            if (numeratorText.toLowerCase() === metric.toLowerCase()) {
              numerator = metric;
            }
            if (denominatorText.toLowerCase() === metric.toLowerCase()) {
              denominator = metric;
            }
          });
          
          // Also check if the extracted terms contain the exact metric names
          // This handles cases where the query includes the full metric name with some extra text
          allMetrics.forEach(metric => {
            if (numeratorText.toLowerCase().includes(metric.toLowerCase())) {
              numerator = metric;
            }
            if (denominatorText.toLowerCase().includes(metric.toLowerCase())) {
              denominator = metric;
            }
          });
          
          // Apply term mapping for partial matches regardless of current values
          Object.keys(metricMappings).forEach(term => {
            if (numeratorText.includes(term)) {
              numerator = metricMappings[term];
            }
            if (denominatorText.includes(term)) {
              denominator = metricMappings[term];
            }
          });
          
          // Special handling for common terms
          if (numeratorText.includes("order") || numeratorText.includes("confirmation")) {
            numerator = "cse>mobility_sales>order_confirmation";
          }
          if (denominatorText.includes("order") || denominatorText.includes("confirmation")) {
            denominator = "cse>mobility_sales>order_confirmation";
          }
          if (numeratorText.includes("visit") || numeratorText.includes("traffic")) {
            numerator = "Visits";
          }
          if (denominatorText.includes("visit") || denominatorText.includes("traffic")) {
            denominator = "Visits";
          }
        }
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
      metrics.push(
        "Unique Visitors",
        "Visits",
        "cse>mobility_sales>getting_started",
        "cse>mobility_sales>product_inventory",
        "pap_added:credit_card",
        "cse>mobility_sales>order_confirmation"
      );
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
      let sortBy = "Visits"; // Default
      if (lowerQuery.includes("unique visitor")) {
        sortBy = "Unique Visitors";
      } else if (lowerQuery.includes("getting started") || lowerQuery.includes("start page")) {
        sortBy = "cse>mobility_sales>getting_started";
      } else if (lowerQuery.includes("product inventory") || lowerQuery.includes("inventory page")) {
        sortBy = "cse>mobility_sales>product_inventory";
      } else if (lowerQuery.includes("credit card") || lowerQuery.includes("pap") || lowerQuery.includes("addition")) {
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
      let sortBy = "Visits"; // Default
      if (lowerQuery.includes("unique visitor")) {
        sortBy = "Unique Visitors";
      } else if (lowerQuery.includes("getting started") || lowerQuery.includes("start page")) {
        sortBy = "cse>mobility_sales>getting_started";
      } else if (lowerQuery.includes("product inventory") || lowerQuery.includes("inventory page")) {
        sortBy = "cse>mobility_sales>product_inventory";
      } else if (lowerQuery.includes("credit card") || lowerQuery.includes("pap") || lowerQuery.includes("addition")) {
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
      let sortBy = "Visits"; // Default
      if (lowerQuery.includes("unique visitor")) {
        sortBy = "Unique Visitors";
      } else if (lowerQuery.includes("getting started") || lowerQuery.includes("start page")) {
        sortBy = "cse>mobility_sales>getting_started";
      } else if (lowerQuery.includes("product inventory") || lowerQuery.includes("inventory page")) {
        sortBy = "cse>mobility_sales>product_inventory";
      } else if (lowerQuery.includes("credit card") || lowerQuery.includes("pap") || lowerQuery.includes("addition")) {
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
