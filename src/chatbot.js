/**
 * Analytics Chatbot
 * 
 * A simple chatbot interface that can process natural language queries
 * and convert them to BigQuery SQL queries.
 */

const bigQueryService = require('./services/bigquery-service');

class AnalyticsChatbot {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the chatbot with configuration
   * @param {Object} config - Configuration object
   * @param {Object} config.bigQuery - BigQuery configuration
   */
  async initialize(config) {
    if (!config || !config.bigQuery) {
      throw new Error('Invalid configuration. BigQuery configuration is required.');
    }

    // Initialize BigQuery service
    await bigQueryService.initialize(config.bigQuery);
    this.initialized = true;
    console.log('Analytics Chatbot initialized successfully');
  }

  /**
   * Process a user query
   * @param {string} userQuery - Natural language query from the user
   * @returns {Promise<Object>} - Response to the user
   */
  async processQuery(userQuery) {
    if (!this.initialized) {
      return {
        type: 'error',
        message: 'Chatbot is not initialized. Please initialize with configuration first.'
      };
    }

    try {
      console.log(`Processing user query: ${userQuery}`);

      // Simple keyword-based query processing
      // In a real implementation, this would use NLP to convert natural language to SQL
      const lowerQuery = userQuery.toLowerCase();
      
      // Handle different types of queries
      if (lowerQuery.includes('list tables') || lowerQuery.includes('show tables')) {
        const tables = await bigQueryService.listTables();
        return {
          type: 'tableList',
          message: 'Here are the available tables:',
          data: tables
        };
      }
      else if (lowerQuery.includes('dealer') && (lowerQuery.includes('list') || lowerQuery.includes('show'))) {
        // Execute a query to get all dealers
        const results = await bigQueryService.executeQuery('SELECT * FROM dealer_analytics LIMIT 10');
        return {
          type: 'queryResults',
          message: 'Here are the dealers:',
          data: results
        };
      }
      else if (lowerQuery.includes('schema') || lowerQuery.includes('structure')) {
        // Extract table name - this is a very simple extraction
        // In a real implementation, use NLP to extract entities
        const tableMatch = lowerQuery.match(/schema (?:of|for)? (\w+)/i) || 
                          lowerQuery.match(/structure (?:of|for)? (\w+)/i) ||
                          lowerQuery.match(/(\w+) schema/i);
        
        if (tableMatch && tableMatch[1]) {
          const tableName = tableMatch[1];
          const schema = await bigQueryService.getTableSchema(tableName);
          return {
            type: 'tableSchema',
            message: `Schema for table ${tableName}:`,
            data: schema
          };
        } else {
          return {
            type: 'error',
            message: 'Please specify a table name to get its schema.'
          };
        }
      }
      else if (lowerQuery.includes('top') && lowerQuery.includes('visits')) {
        // Handle query for top sales reps by visits
        const limit = lowerQuery.match(/top\s+(\d+)/i) ? parseInt(lowerQuery.match(/top\s+(\d+)/i)[1]) : 5;
        
        console.log(`Processing top sales reps query with limit: ${limit}`);
        
        // Query for top sales reps by visits
        const sql = `SELECT * FROM dealer_analytics ORDER BY Visits DESC LIMIT ${limit}`;
        const results = await bigQueryService.executeQuery(sql);
        
        return {
          type: 'queryResults',
          message: `Top ${limit} sales reps by visits:`,
          data: results
        };
      }
      else if (lowerQuery.includes('select') || lowerQuery.includes('query') || lowerQuery.includes('data')) {
        // For demo purposes, we'll just execute a simple query
        // In a real implementation, use NLP to convert natural language to SQL
        let sql;
        
        if (lowerQuery.includes('select')) {
          // If the user provided a SQL query, use it directly
          sql = userQuery;
        } else if (lowerQuery.includes('telus')) {
          // Query for TELUS data
          sql = 'SELECT * FROM dealer_analytics WHERE dealer LIKE "%telus%" LIMIT 10';
        } else if (lowerQuery.includes('walmart') || lowerQuery.includes('wal-mart')) {
          // Query for Walmart data
          sql = 'SELECT * FROM dealer_analytics WHERE dealer LIKE "%wal-mart%" LIMIT 10';
        } else {
          // Default query
          sql = 'SELECT * FROM dealer_analytics LIMIT 10';
        }
        
        const results = await bigQueryService.executeQuery(sql);
        return {
          type: 'queryResults',
          message: 'Query results:',
          data: results
        };
      }
      else {
        // Default response for unrecognized queries
        return {
          type: 'text',
          message: "I'm not sure how to answer that. Try asking about tables, schemas, or running a query."
        };
      }
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        type: 'error',
        message: `Error processing your query: ${error.message}`
      };
    }
  }
}

// Export a singleton instance
const chatbot = new AnalyticsChatbot();
module.exports = chatbot;
