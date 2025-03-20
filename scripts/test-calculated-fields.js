/**
 * Test script for calculated fields
 * 
 * This script tests the ability to create calculated fields using the data service.
 */

// Import the fs and path modules directly
const fs = require('fs');
const path = require('path');

// Create our own DataService instance for testing
class DataService {
  constructor() {
    this.data = null;
    this.headers = null;
    this.dealerNames = [];
    this.metrics = [];
    this.dataLoaded = false;
  }

  async loadData(filePath) {
    try {
      // Read the file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse the CSV data
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      
      // Find the start of the actual data (after the headers)
      let dataStartIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Dealer Legal Name')) {
          dataStartIndex = i;
          break;
        }
      }
      
      console.log(`Found data start at line ${dataStartIndex}: ${lines[dataStartIndex]}`);
      
      // Extract headers
      this.headers = this.parseCSVLine(lines[dataStartIndex]);
      console.log('Parsed headers:', this.headers);
      
      // Extract metrics from headers
      this.metrics = this.headers.slice(1);
      
      // Parse data rows
      this.data = [];
      for (let i = dataStartIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue;
        
        const values = this.parseCSVLine(line);
        if (values.length >= this.headers.length) {
          const row = {};
          row[this.headers[0]] = values[0];
          this.dealerNames.push(values[0]);
          
          for (let j = 1; j < this.headers.length; j++) {
            row[this.headers[j]] = values[j];
          }
          
          this.data.push(row);
        }
      }
      
      this.dataLoaded = true;
      console.log(`Loaded ${this.data.length} rows of data with ${this.metrics.length} metrics`);
      return true;
    } catch (error) {
      console.error('Error loading data:', error);
      return false;
    }
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
}

const dataService = new DataService();

async function testCalculatedFields() {
  try {
    // Load the data
    // Use a simpler file name to avoid issues with spaces and special characters
    const dataPath = path.join(__dirname, '..', 'data', 'telus_analytics_sample.csv');
    const success = await dataService.loadData(dataPath);
    
    if (!success) {
      console.error('Failed to load data');
      return;
    }
    
    // Print the headers
    console.log('Headers:', dataService.headers);
    
    // Print the first row of data
    if (dataService.data && dataService.data.length > 0) {
      console.log('First row:', dataService.data[0]);
    }
    
    // Test some calculated fields
    // For example, if we have Visits and Unique Visitors, we can calculate visits per visitor
    if (dataService.data && dataService.data.length > 0) {
      const firstRow = dataService.data[0];
      
      // Check if we have Visits and Unique Visitors fields
      if (firstRow['Visits'] && firstRow['Unique Visitors']) {
        const visitsPerVisitor = Number(firstRow['Visits']) / Number(firstRow['Unique Visitors']);
        console.log('Visits per Visitor:', visitsPerVisitor);
      }
      
      // Check if we have other numeric fields we can use for calculations
      const numericFields = [];
      for (const key in firstRow) {
        if (!isNaN(Number(firstRow[key]))) {
          numericFields.push(key);
        }
      }
      
      console.log('Numeric fields available for calculations:', numericFields);
    }
    
  } catch (error) {
    console.error('Error testing calculated fields:', error);
  }
}

// Run the test
testCalculatedFields();
