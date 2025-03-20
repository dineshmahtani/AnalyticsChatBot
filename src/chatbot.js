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
  initialize(config) {
    if (!config || !config.bigQuery) {
      throw new Error('Invalid configuration. BigQuery configuration is required.');
    }

    // Initialize BigQuery service
    bigQueryService.initialize(config.bigQuery);
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
      else if (lowerQuery.includes('select') || lowerQuery.includes('query')) {
        // For demo purposes, we'll just execute a simple query
        // In a real implementation, use NLP to convert natural language to SQL
        let sql;
        
        if (lowerQuery.includes('select')) {
          // If the user provided a SQL query, use it directly
          sql = userQuery;
        } else {
          // Simple keyword-based query generation
          // This is just a placeholder - in a real implementation, use NLP
          sql = 'SELECT * FROM sample_table_1 LIMIT 10';
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
