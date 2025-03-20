/**
 * BigQuery Service
 * 
 * This service provides an interface to interact with Google BigQuery
 * through the MCP server. It handles query formatting, execution, and
 * result processing.
 * 
 * For testing purposes, it can also use local CSV data.
 */

const dataService = require('./data-service');
const path = require('path');

class BigQueryService {
  constructor() {
    this.isConfigured = false;
    this.mcpServerName = 'bigquery';
    this.useLocalData = true; // For testing with local data
    this.localDataPath = path.join(__dirname, '..', '..', 'data', 'Dealer MSS (Copy)_Dinesh (Copy) - TELUS Global Production - Mar 20, 2025.csv');
  }

  /**
   * Initialize the BigQuery service with configuration
   * @param {Object} config - Configuration object
   * @param {string} config.projectId - GCP Project ID
   * @param {string} config.location - GCP Location
   * @param {string} config.dataset - BigQuery Dataset name
   * @param {boolean} config.useLocalData - Whether to use local data for testing
   * @param {string} config.localDataPath - Path to local data file (optional)
   */
  async initialize(config) {
    this.config = config;
    this.isConfigured = true;
    
    // If useLocalData is specified in config, use that value
    if (config.useLocalData !== undefined) {
      this.useLocalData = config.useLocalData;
    }
    
    // If localDataPath is specified in config, use that value
    if (config.localDataPath) {
      this.localDataPath = config.localDataPath;
    }
    
    // If using local data, load it
    if (this.useLocalData) {
      try {
        const success = await dataService.loadData(this.localDataPath);
        if (success) {
          console.log('Loaded local data for testing');
        } else {
          console.error('Failed to load local data');
        }
      } catch (error) {
        console.error('Error loading local data:', error);
      }
    }
    
    console.log('BigQuery service initialized with config:', config);
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean} - Whether the service is configured
   */
  checkConfiguration() {
    if (!this.isConfigured) {
      console.error('BigQuery service is not configured. Call initialize() first.');
      return false;
    }
    return true;
  }

  /**
   * Execute a SQL query against BigQuery
   * @param {string} sql - SQL query to execute
   * @returns {Promise<Object>} - Query results
   */
  async executeQuery(sql) {
    if (!this.checkConfiguration()) {
      throw new Error('BigQuery service is not configured');
    }

    try {
      console.log(`Executing query: ${sql}`);
      
      if (this.useLocalData) {
        // Parse the SQL query to extract information
        // This is a very simple parser and only handles basic queries
        const query = this.parseQuery(sql);
        
        // Execute the query against local data
        const results = dataService.executeQuery(query);
        
        // Apply sorting if specified in the query
        if (query.orderBy) {
          console.log(`Sorting results by ${query.orderBy.field} ${query.orderBy.direction}`);
          results.sort((a, b) => {
            const aValue = a[query.orderBy.field];
            const bValue = b[query.orderBy.field];
            
            // Handle numeric sorting
            if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
              return query.orderBy.direction === 'desc' 
                ? Number(bValue) - Number(aValue) 
                : Number(aValue) - Number(bValue);
            }
            
            // Handle string sorting
            const aStr = String(aValue || '');
            const bStr = String(bValue || '');
            return query.orderBy.direction === 'desc' 
              ? bStr.localeCompare(aStr) 
              : aStr.localeCompare(bStr);
          });
        }
        
        // Convert the results to the expected format
        return this.formatResults(results);
      } else {
        // This is a placeholder for the actual MCP tool call
        // In a real implementation, this would use the MCP tool to execute the query
        
        // Placeholder for MCP tool call:
        /*
        const result = await useMcpTool({
          serverName: this.mcpServerName,
          toolName: 'execute_query',
          arguments: {
            sql: sql,
            projectId: this.config.projectId,
            location: this.config.location,
            dataset: this.config.dataset
          }
        });
        return result;
        */
        
        // For now, return mock data
        return {
          success: true,
          rows: [
            { id: 1, name: 'Sample Data 1' },
            { id: 2, name: 'Sample Data 2' }
          ],
          metadata: {
            schema: [
              { name: 'id', type: 'INTEGER' },
              { name: 'name', type: 'STRING' }
            ],
            rowCount: 2
          }
        };
      }
    } catch (error) {
      console.error('Error executing BigQuery query:', error);
      throw error;
    }
  }
  
  /**
   * Parse a SQL query to extract information
   * @param {string} sql - SQL query to parse
   * @returns {Object} - Query parameters
   */
  parseQuery(sql) {
    const query = {};
    
    // Convert to lowercase for easier parsing
    const lowerSql = sql.toLowerCase();
    
    console.log('Parsing SQL query:', sql);
    
    // Extract limit
    const limitMatch = lowerSql.match(/limit\s+(\d+)/i);
    if (limitMatch && limitMatch[1]) {
      query.limit = parseInt(limitMatch[1], 10);
    }
    
    // Extract dealer filter
    const whereMatch = lowerSql.match(/where\s+(.*?)\s+(like|=)\s+['"]%(.*?)%['"]/i);
    if (whereMatch && whereMatch[3]) {
      query.dealer = whereMatch[3];
    }
    
    // Extract metrics
    const selectMatch = lowerSql.match(/select\s+(.*?)\s+from/i);
    if (selectMatch && selectMatch[1]) {
      if (selectMatch[1].includes('*')) {
        // Select all metrics
        query.metrics = [];
      } else {
        // Extract specific metrics
        const metrics = selectMatch[1].split(',')
          .map(m => m.trim())
          .filter(m => m !== 'dealer_legal_name' && m !== 'dealer');
        
        query.metrics = metrics;
      }
    }
    
    // Extract order by
    const orderByMatch = lowerSql.match(/order\s+by\s+(.*?)(?:\s+limit|\s*$)/i);
    if (orderByMatch && orderByMatch[1]) {
      const orderByParts = orderByMatch[1].trim().split(/\s+/);
      if (orderByParts.length >= 1) {
        query.orderBy = {
          field: orderByParts[0],
          direction: orderByParts.length > 1 && orderByParts[1].toLowerCase() === 'desc' ? 'desc' : 'asc'
        };
      }
    }
    
    console.log('Parsed query:', query);
    
    return query;
  }
  
  /**
   * Format results to match the expected output format
   * @param {Array<Object>} results - Query results
   * @returns {Object} - Formatted results
   */
  formatResults(results) {
    if (!results || results.length === 0) {
      return {
        success: true,
        rows: [],
        metadata: {
          schema: [],
          rowCount: 0
        }
      };
    }
    
    // Extract schema from the first result
    const firstResult = results[0];
    const schema = Object.keys(firstResult).map(key => ({
      name: key,
      type: this.inferType(firstResult[key])
    }));
    
    return {
      success: true,
      rows: results,
      metadata: {
        schema,
        rowCount: results.length
      }
    };
  }
  
  /**
   * Infer the data type of a value
   * @param {any} value - Value to infer type for
   * @returns {string} - Inferred type
   */
  inferType(value) {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    
    if (!isNaN(Number(value))) {
      return 'INTEGER';
    }
    
    if (typeof value === 'boolean') {
      return 'BOOLEAN';
    }
    
    if (value instanceof Date) {
      return 'TIMESTAMP';
    }
    
    return 'STRING';
  }

  /**
   * Get a list of tables in the configured dataset
   * @returns {Promise<Array<string>>} - List of table names
   */
  async listTables() {
    if (!this.checkConfiguration()) {
      throw new Error('BigQuery service is not configured');
    }

    try {
      console.log(`Listing tables in dataset: ${this.config.dataset}`);
      
      if (this.useLocalData) {
        // For local data, we'll treat the CSV file as a single table
        return ['dealer_analytics'];
      } else {
        // Placeholder for MCP tool call:
        /*
        const result = await useMcpTool({
          serverName: this.mcpServerName,
          toolName: 'list_tables',
          arguments: {
            projectId: this.config.projectId,
            location: this.config.location,
            dataset: this.config.dataset
          }
        });
        return result.tables;
        */
        
        // For now, return mock data
        return ['sample_table_1', 'sample_table_2', 'sample_table_3'];
      }
    } catch (error) {
      console.error('Error listing BigQuery tables:', error);
      throw error;
    }
  }

  /**
   * Get the schema for a specific table
   * @param {string} tableName - Name of the table
   * @returns {Promise<Array<Object>>} - Table schema
   */
  async getTableSchema(tableName) {
    if (!this.checkConfiguration()) {
      throw new Error('BigQuery service is not configured');
    }

    try {
      console.log(`Getting schema for table: ${tableName}`);
      
      if (this.useLocalData && tableName === 'dealer_analytics') {
        // For local data, generate schema from the headers
        const metrics = dataService.getMetrics();
        
        // Create schema with dealer name and metrics
        const schema = [
          { 
            name: 'Dealer Legal Name', 
            type: 'STRING', 
            mode: 'REQUIRED', 
            description: 'Name of the dealer' 
          }
        ];
        
        // Add metrics to schema
        metrics.forEach(metric => {
          schema.push({
            name: metric,
            type: 'INTEGER',
            mode: 'NULLABLE',
            description: `Metric: ${metric}`
          });
        });
        
        return schema;
      } else {
        // Placeholder for MCP tool call:
        /*
        const result = await useMcpTool({
          serverName: this.mcpServerName,
          toolName: 'get_table_schema',
          arguments: {
            projectId: this.config.projectId,
            location: this.config.location,
            dataset: this.config.dataset,
            tableName: tableName
          }
        });
        return result.schema;
        */
        
        // For now, return mock data
        return [
          { name: 'id', type: 'INTEGER', mode: 'REQUIRED', description: 'Unique identifier' },
          { name: 'name', type: 'STRING', mode: 'REQUIRED', description: 'Name field' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'NULLABLE', description: 'Creation timestamp' }
        ];
      }
    } catch (error) {
      console.error(`Error getting schema for table ${tableName}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
const bigQueryService = new BigQueryService();
module.exports = bigQueryService;
