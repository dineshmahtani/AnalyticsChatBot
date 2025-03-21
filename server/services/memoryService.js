/**
 * Memory Service for Cline Analytics Chatbot
 * 
 * This service provides functionality to store and retrieve conversation history,
 * enabling the chatbot to maintain context across interactions.
 */

// In-memory storage for conversations
// In a production environment, this would be replaced with a database
const memoryStore = {
  conversations: [],
  userPreferences: {}
};

/**
 * Add a new interaction to the memory store
 * @param {Object} interaction - The interaction to store
 * @param {string} interaction.query - User's query
 * @param {Object} interaction.parsedQuery - Parsed query structure
 * @param {Object} interaction.response - Response data
 * @param {string} [interaction.userId] - Optional user identifier
 * @returns {string} ID of the stored interaction
 */
function storeInteraction(interaction) {
  const timestamp = Date.now();
  const id = `interaction_${timestamp}`;
  
  const storedInteraction = {
    id,
    timestamp,
    query: interaction.query,
    parsedQuery: interaction.parsedQuery,
    response: interaction.response,
    userId: interaction.userId || 'anonymous',
    referenced: false // Track if this interaction has been referenced later
  };
  
  memoryStore.conversations.push(storedInteraction);
  
  // Limit the size of the in-memory store (keep last 100 interactions)
  if (memoryStore.conversations.length > 100) {
    memoryStore.conversations = memoryStore.conversations.slice(-100);
  }
  
  return id;
}

/**
 * Get recent interactions
 * @param {Object} options - Query options
 * @param {number} [options.limit=10] - Maximum number of interactions to return
 * @param {string} [options.userId] - Filter by user ID
 * @param {boolean} [options.includeResponse=true] - Whether to include response data
 * @returns {Array} Recent interactions
 */
function getRecentInteractions(options = {}) {
  const limit = options.limit || 10;
  const userId = options.userId;
  const includeResponse = options.includeResponse !== false;
  
  let interactions = [...memoryStore.conversations];
  
  // Filter by user ID if provided
  if (userId) {
    interactions = interactions.filter(interaction => interaction.userId === userId);
  }
  
  // Sort by timestamp (newest first)
  interactions.sort((a, b) => b.timestamp - a.timestamp);
  
  // Limit the number of results
  interactions = interactions.slice(0, limit);
  
  // Optionally exclude response data to reduce payload size
  if (!includeResponse) {
    interactions = interactions.map(({ response, ...rest }) => rest);
  }
  
  return interactions;
}

/**
 * Find interactions related to a query
 * @param {string} query - The query to find related interactions for
 * @param {Object} options - Search options
 * @param {number} [options.limit=5] - Maximum number of interactions to return
 * @param {string} [options.userId] - Filter by user ID
 * @returns {Array} Related interactions
 */
function findRelatedInteractions(query, options = {}) {
  const limit = options.limit || 5;
  const userId = options.userId;
  
  // Simple keyword matching for related queries
  // In a production environment, this would use more sophisticated NLP techniques
  const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  
  let interactions = [...memoryStore.conversations];
  
  // Filter by user ID if provided
  if (userId) {
    interactions = interactions.filter(interaction => interaction.userId === userId);
  }
  
  // Score interactions based on keyword matches
  const scoredInteractions = interactions.map(interaction => {
    const interactionText = interaction.query.toLowerCase();
    let score = 0;
    
    keywords.forEach(keyword => {
      if (interactionText.includes(keyword)) {
        score += 1;
      }
    });
    
    return { ...interaction, relevanceScore: score };
  });
  
  // Sort by relevance score (highest first)
  scoredInteractions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Filter out irrelevant interactions (score of 0)
  const relevantInteractions = scoredInteractions.filter(interaction => interaction.relevanceScore > 0);
  
  // Limit the number of results
  return relevantInteractions.slice(0, limit);
}

/**
 * Get an interaction by ID
 * @param {string} id - The interaction ID
 * @returns {Object|null} The interaction or null if not found
 */
function getInteractionById(id) {
  return memoryStore.conversations.find(interaction => interaction.id === id) || null;
}

/**
 * Mark an interaction as referenced
 * @param {string} id - The interaction ID
 * @returns {boolean} Whether the operation was successful
 */
function markInteractionAsReferenced(id) {
  const interaction = memoryStore.conversations.find(interaction => interaction.id === id);
  
  if (interaction) {
    interaction.referenced = true;
    return true;
  }
  
  return false;
}

/**
 * Store user preferences
 * @param {string} userId - User identifier
 * @param {Object} preferences - User preferences
 * @returns {boolean} Whether the operation was successful
 */
function storeUserPreferences(userId, preferences) {
  memoryStore.userPreferences[userId] = {
    ...memoryStore.userPreferences[userId],
    ...preferences,
    lastUpdated: Date.now()
  };
  
  return true;
}

/**
 * Get user preferences
 * @param {string} userId - User identifier
 * @returns {Object} User preferences
 */
function getUserPreferences(userId) {
  return memoryStore.userPreferences[userId] || {};
}

/**
 * Clear all interactions for a user
 * @param {string} userId - User identifier
 * @returns {number} Number of interactions cleared
 */
function clearUserInteractions(userId) {
  const initialCount = memoryStore.conversations.length;
  
  memoryStore.conversations = memoryStore.conversations.filter(
    interaction => interaction.userId !== userId
  );
  
  return initialCount - memoryStore.conversations.length;
}

/**
 * Get memory statistics
 * @returns {Object} Memory statistics
 */
function getMemoryStats() {
  const totalInteractions = memoryStore.conversations.length;
  const userCount = new Set(memoryStore.conversations.map(i => i.userId)).size;
  const referencedCount = memoryStore.conversations.filter(i => i.referenced).length;
  
  return {
    totalInteractions,
    userCount,
    referencedCount,
    userPreferencesCount: Object.keys(memoryStore.userPreferences).length
  };
}

module.exports = {
  storeInteraction,
  getRecentInteractions,
  findRelatedInteractions,
  getInteractionById,
  markInteractionAsReferenced,
  storeUserPreferences,
  getUserPreferences,
  clearUserInteractions,
  getMemoryStats
};
