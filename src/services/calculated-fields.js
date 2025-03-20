/**
 * Calculated Fields Service
 * 
 * This service provides functionality to create and manage calculated fields
 * based on the data in the CSV files.
 */

class CalculatedFieldsService {
  constructor() {
    this.calculatedFields = {};
  }

  /**
   * Register a new calculated field
   * @param {string} name - Name of the calculated field
   * @param {Function} formula - Function to calculate the field value
   * @param {string} description - Description of the calculated field
   */
  registerCalculatedField(name, formula, description) {
    this.calculatedFields[name] = {
      formula,
      description
    };
    console.log(`Registered calculated field: ${name}`);
  }

  /**
   * Get all registered calculated fields
   * @returns {Object} - Object with calculated field names as keys
   */
  getCalculatedFields() {
    return this.calculatedFields;
  }

  /**
   * Check if a field is a calculated field
   * @param {string} fieldName - Name of the field to check
   * @returns {boolean} - Whether the field is a calculated field
   */
  isCalculatedField(fieldName) {
    return this.calculatedFields.hasOwnProperty(fieldName);
  }

  /**
   * Calculate the value of a calculated field for a row of data
   * @param {string} fieldName - Name of the calculated field
   * @param {Object} row - Row of data
   * @returns {any} - Calculated value
   */
  calculateField(fieldName, row) {
    if (!this.isCalculatedField(fieldName)) {
      throw new Error(`${fieldName} is not a registered calculated field`);
    }
    
    try {
      return this.calculatedFields[fieldName].formula(row);
    } catch (error) {
      console.error(`Error calculating field ${fieldName}:`, error);
      return null;
    }
  }

  /**
   * Apply calculated fields to a dataset
   * @param {Array<Object>} data - Array of data rows
   * @param {Array<string>} fields - Array of field names to apply (optional)
   * @returns {Array<Object>} - Data with calculated fields added
   */
  applyCalculatedFields(data, fields = null) {
    const fieldsToApply = fields 
      ? fields.filter(f => this.isCalculatedField(f))
      : Object.keys(this.calculatedFields);
    
    if (fieldsToApply.length === 0) {
      return data;
    }
    
    return data.map(row => {
      const newRow = { ...row };
      
      fieldsToApply.forEach(field => {
        newRow[field] = this.calculateField(field, row);
      });
      
      return newRow;
    });
  }

  /**
   * Initialize default calculated fields
   * @param {Array<string>} headers - Headers from the data
   */
  initializeDefaultFields(headers) {
    // Find numeric fields that we can use for calculations
    const numericFields = headers.filter(header => 
      header !== 'Dealer Legal Name' && 
      header !== 'Dealer Legal Name (v183)'
    );
    
    // Register some default calculated fields
    if (numericFields.length >= 2) {
      // Ratio between first two numeric fields
      const field1 = numericFields[0];
      const field2 = numericFields[1];
      
      this.registerCalculatedField(
        `${field1}_to_${field2}_ratio`,
        (row) => {
          const val1 = Number(row[field1]);
          const val2 = Number(row[field2]);
          return val2 !== 0 ? val1 / val2 : 0;
        },
        `Ratio of ${field1} to ${field2}`
      );
      
      // Sum of all numeric fields
      this.registerCalculatedField(
        'total_metrics',
        (row) => {
          return numericFields.reduce((sum, field) => {
            return sum + Number(row[field] || 0);
          }, 0);
        },
        'Sum of all numeric metrics'
      );
      
      // Average of all numeric fields
      this.registerCalculatedField(
        'average_metrics',
        (row) => {
          const sum = numericFields.reduce((acc, field) => {
            return acc + Number(row[field] || 0);
          }, 0);
          return numericFields.length > 0 ? sum / numericFields.length : 0;
        },
        'Average of all numeric metrics'
      );
    }
  }
}

// Export a singleton instance
const calculatedFieldsService = new CalculatedFieldsService();
module.exports = calculatedFieldsService;
