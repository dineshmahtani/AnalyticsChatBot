const express = require('express');
const router = express.Router();
const nlpService = require('../services/nlp');
const queryProcessor = require('../services/queryProcessor');

// Endpoint to process natural language queries
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    console.log('Received query:', query);
    
    // Process the natural language query
    const parsedQuery = await nlpService.parseQuery(query);
    console.log('Parsed query:', parsedQuery);
    
    // Execute the query against our data
    const results = await queryProcessor.executeQuery(parsedQuery);
    
    res.json({ results });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ error: 'Failed to process query', message: error.message });
  }
});

// Endpoint to get available metrics and dimensions
router.get('/metadata', async (req, res) => {
  try {
    const metadata = await queryProcessor.getMetadata();
    res.json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

module.exports = router;
