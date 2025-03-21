const express = require('express');
const router = express.Router();
const nlpService = require('../services/nlp');
const queryProcessor = require('../services/queryProcessor');
const memoryService = require('../services/memoryService');

// Endpoint to process natural language queries
router.post('/query', async (req, res) => {
  try {
    const { query, userId } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    console.log('Received query:', query);
    
    // Process the natural language query
    const parsedQuery = await nlpService.parseQuery(query);
    console.log('Parsed query:', parsedQuery);
    
    // Check for related previous interactions
    const relatedInteractions = memoryService.findRelatedInteractions(query, { 
      userId, 
      limit: 3 
    });
    
    // Generate a human-readable interpretation of the query
    const interpretation = queryProcessor.generateQueryInterpretation(parsedQuery);
    console.log('Query interpretation:', interpretation);
    
    // Execute the query against our data
    const results = await queryProcessor.executeQuery(parsedQuery);
    
    // Store the interaction in memory
    const interactionId = memoryService.storeInteraction({
      query,
      parsedQuery,
      interpretation,
      response: results,
      userId: userId || 'anonymous'
    });
    
    // Include related interactions in the response
    res.json({ 
      results,
      interpretation,
      interactionId,
      relatedInteractions: relatedInteractions.length > 0 ? relatedInteractions : undefined
    });
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

// Memory-related endpoints

// Get recent interactions
router.get('/memory/recent', (req, res) => {
  try {
    const { limit, userId } = req.query;
    const interactions = memoryService.getRecentInteractions({
      limit: limit ? parseInt(limit) : undefined,
      userId,
      includeResponse: false // Don't include full response data to reduce payload size
    });
    
    res.json({ interactions });
  } catch (error) {
    console.error('Error fetching recent interactions:', error);
    res.status(500).json({ error: 'Failed to fetch recent interactions' });
  }
});

// Get a specific interaction by ID
router.get('/memory/interaction/:id', (req, res) => {
  try {
    const { id } = req.params;
    const interaction = memoryService.getInteractionById(id);
    
    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    
    res.json({ interaction });
  } catch (error) {
    console.error('Error fetching interaction:', error);
    res.status(500).json({ error: 'Failed to fetch interaction' });
  }
});

// Find related interactions
router.post('/memory/related', (req, res) => {
  try {
    const { query, userId, limit } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const relatedInteractions = memoryService.findRelatedInteractions(query, {
      userId,
      limit: limit ? parseInt(limit) : undefined
    });
    
    res.json({ relatedInteractions });
  } catch (error) {
    console.error('Error finding related interactions:', error);
    res.status(500).json({ error: 'Failed to find related interactions' });
  }
});

// Mark an interaction as referenced
router.post('/memory/reference/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = memoryService.markInteractionAsReferenced(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking interaction as referenced:', error);
    res.status(500).json({ error: 'Failed to mark interaction as referenced' });
  }
});

// Store user preferences
router.post('/memory/preferences', (req, res) => {
  try {
    const { userId, preferences } = req.body;
    
    if (!userId || !preferences) {
      return res.status(400).json({ error: 'User ID and preferences are required' });
    }
    
    const success = memoryService.storeUserPreferences(userId, preferences);
    res.json({ success });
  } catch (error) {
    console.error('Error storing user preferences:', error);
    res.status(500).json({ error: 'Failed to store user preferences' });
  }
});

// Get user preferences
router.get('/memory/preferences/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = memoryService.getUserPreferences(userId);
    res.json({ preferences });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch user preferences' });
  }
});

// Clear user interactions
router.delete('/memory/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const count = memoryService.clearUserInteractions(userId);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error clearing user interactions:', error);
    res.status(500).json({ error: 'Failed to clear user interactions' });
  }
});

// Get memory statistics
router.get('/memory/stats', (req, res) => {
  try {
    const stats = memoryService.getMemoryStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching memory statistics:', error);
    res.status(500).json({ error: 'Failed to fetch memory statistics' });
  }
});

module.exports = router;
