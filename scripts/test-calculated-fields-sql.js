/**
 * Test script for calculated fields using SQL queries
 * 
 * This script tests the ability to create and use calculated fields in SQL queries.
 */

const bigQueryService = require('../src/services/bigquery-service');
const dataService = require('../src/services/data-service');
const calculatedFieldsService = require('../src/services/calculated-fields');
const path = require('path');

async function testCalculatedFieldsSQL() {
  try {
    // Initialize the BigQuery service with local data
    await bigQueryService.initialize({
      projectId: 'local-testing',
      location: 'local',
      dataset: 'telus_analytics',
      useLocalData: true,
      localDataPath: path.join(__dirname, '..', 'data', 'telus_analytics_sample.csv')
    });
    
    console.log('BigQuery service initialized');
    
    // Test 1: Create a calculated field using SQL
    console.log('\n--- Test 1: Create a calculated field using SQL ---');
    const sql1 = 'SELECT "Dealer Legal Name (v183)", 5209 / 34655 AS ratio FROM dealer_analytics LIMIT 5';
    console.log('Executing SQL:', sql1);
    const results1 = await bigQueryService.executeQuery(sql1);
    console.log('Results:', JSON.stringify(results1.rows, null, 2));
    
    // Test 2: List calculated fields
    console.log('\n--- Test 2: List calculated fields ---');
    const calculatedFields = dataService.getCalculatedFields();
    console.log('Calculated fields:', calculatedFields);
    
    // Test 3: Create a calculated field manually
    console.log('\n--- Test 3: Create a calculated field manually ---');
    dataService.registerCalculatedField(
      'total_sum',
      (row) => {
        return Number(row['5209'] || 0) + Number(row['34655\r'] || 0);
      },
      'Sum of 5209 and 34655'
    );
    
    // Test 4: Query with the manually created calculated field
    console.log('\n--- Test 4: Query with the manually created calculated field ---');
    const sql2 = 'SELECT "Dealer Legal Name (v183)", total_sum FROM dealer_analytics ORDER BY total_sum DESC LIMIT 5';
    console.log('Executing SQL:', sql2);
    const results2 = await bigQueryService.executeQuery(sql2);
    console.log('Results:', JSON.stringify(results2.rows, null, 2));
    
    // Test 5: Create a more complex calculated field
    console.log('\n--- Test 5: Create a more complex calculated field ---');
    dataService.registerCalculatedField(
      'weighted_score',
      (row) => {
        const val1 = Number(row['5209'] || 0);
        const val2 = Number(row['34655\r'] || 0);
        return (val1 * 0.7) + (val2 * 0.3);
      },
      'Weighted score: 70% of 5209 + 30% of 34655'
    );
    
    // Test 6: Query with the complex calculated field
    console.log('\n--- Test 6: Query with the complex calculated field ---');
    const sql3 = 'SELECT "Dealer Legal Name (v183)", weighted_score FROM dealer_analytics ORDER BY weighted_score DESC LIMIT 5';
    console.log('Executing SQL:', sql3);
    const results3 = await bigQueryService.executeQuery(sql3);
    console.log('Results:', JSON.stringify(results3.rows, null, 2));
    
    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('Error testing calculated fields:', error);
  }
}

// Run the test
testCalculatedFieldsSQL();
