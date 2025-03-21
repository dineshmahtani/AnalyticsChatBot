/**
 * Memory Component for Cline Analytics Chatbot
 * 
 * This component provides UI elements for displaying conversation history,
 * related queries, and memory management features.
 */

/**
 * Initialize the memory component
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - Container element for the memory UI
 * @param {Function} options.onQuerySelect - Callback when a query is selected
 * @param {Function} options.onClearMemory - Callback when memory is cleared
 */
function initMemoryComponent(options) {
  const container = options.container;
  const onQuerySelect = options.onQuerySelect;
  const onClearMemory = options.onClearMemory;
  
  // Create memory panel
  const memoryPanel = document.createElement('div');
  memoryPanel.className = 'memory-panel';
  memoryPanel.innerHTML = `
    <div class="memory-header">
      <h3>Memory Bank</h3>
      <button id="memory-toggle" class="memory-toggle" title="Toggle Memory Panel">
        <span class="toggle-icon">◀</span>
      </button>
    </div>
    <div class="memory-content">
      <div class="memory-section">
        <h4>Recent Queries</h4>
        <div id="recent-queries" class="memory-list"></div>
      </div>
      <div class="memory-section">
        <h4>Related Queries</h4>
        <div id="related-queries" class="memory-list"></div>
      </div>
      <div class="memory-actions">
        <button id="clear-memory" class="memory-button">Clear Memory</button>
      </div>
    </div>
  `;
  
  container.appendChild(memoryPanel);
  
  // Get references to elements
  const memoryToggle = document.getElementById('memory-toggle');
  const recentQueriesContainer = document.getElementById('recent-queries');
  const relatedQueriesContainer = document.getElementById('related-queries');
  const clearMemoryButton = document.getElementById('clear-memory');
  
  // Set up event listeners
  memoryToggle.addEventListener('click', toggleMemoryPanel);
  clearMemoryButton.addEventListener('click', () => {
    if (onClearMemory && typeof onClearMemory === 'function') {
      onClearMemory();
    }
  });
  
  // Initialize state
  let isMemoryPanelOpen = false;
  let userId = localStorage.getItem('userId') || generateUserId();
  
  // Save user ID to local storage
  localStorage.setItem('userId', userId);
  
  /**
   * Toggle the memory panel visibility
   */
  function toggleMemoryPanel() {
    isMemoryPanelOpen = !isMemoryPanelOpen;
    
    if (isMemoryPanelOpen) {
      memoryPanel.classList.add('open');
      memoryToggle.querySelector('.toggle-icon').textContent = '▶';
      memoryToggle.title = 'Hide Memory Panel';
      
      // Load recent queries when panel is opened
      loadRecentQueries();
    } else {
      memoryPanel.classList.remove('open');
      memoryToggle.querySelector('.toggle-icon').textContent = '◀';
      memoryToggle.title = 'Show Memory Panel';
    }
  }
  
  /**
   * Load recent queries from the server
   */
  async function loadRecentQueries() {
    try {
      const response = await fetch(`/api/memory/recent?userId=${userId}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent queries');
      }
      
      const data = await response.json();
      displayRecentQueries(data.interactions || []);
    } catch (error) {
      console.error('Error loading recent queries:', error);
      recentQueriesContainer.innerHTML = '<p class="memory-error">Failed to load recent queries</p>';
    }
  }
  
  /**
   * Display recent queries in the UI
   * @param {Array} interactions - Recent interactions
   */
  function displayRecentQueries(interactions) {
    if (!interactions || interactions.length === 0) {
      recentQueriesContainer.innerHTML = '<p class="memory-empty">No recent queries</p>';
      return;
    }
    
    recentQueriesContainer.innerHTML = '';
    
    interactions.forEach(interaction => {
      const queryItem = document.createElement('div');
      queryItem.className = 'memory-item';
      
      // Format timestamp
      const timestamp = new Date(interaction.timestamp);
      const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const formattedDate = timestamp.toLocaleDateString();
      
      queryItem.innerHTML = `
        <div class="memory-item-content">
          <div class="memory-item-query">${interaction.query}</div>
          <div class="memory-item-time">${formattedTime} - ${formattedDate}</div>
        </div>
      `;
      
      queryItem.addEventListener('click', () => {
        if (onQuerySelect && typeof onQuerySelect === 'function') {
          onQuerySelect(interaction.query, interaction.id);
        }
      });
      
      recentQueriesContainer.appendChild(queryItem);
    });
  }
  
  /**
   * Display related queries in the UI
   * @param {Array} interactions - Related interactions
   */
  function displayRelatedQueries(interactions) {
    if (!interactions || interactions.length === 0) {
      relatedQueriesContainer.innerHTML = '<p class="memory-empty">No related queries</p>';
      return;
    }
    
    relatedQueriesContainer.innerHTML = '';
    
    interactions.forEach(interaction => {
      const queryItem = document.createElement('div');
      queryItem.className = 'memory-item';
      
      // Format timestamp
      const timestamp = new Date(interaction.timestamp);
      const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      queryItem.innerHTML = `
        <div class="memory-item-content">
          <div class="memory-item-query">${interaction.query}</div>
          <div class="memory-item-time">${formattedTime}</div>
        </div>
        <div class="memory-item-score">Relevance: ${interaction.relevanceScore}</div>
      `;
      
      queryItem.addEventListener('click', () => {
        if (onQuerySelect && typeof onQuerySelect === 'function') {
          onQuerySelect(interaction.query, interaction.id);
          
          // Mark as referenced
          fetch(`/api/memory/reference/${interaction.id}`, {
            method: 'POST'
          }).catch(error => {
            console.error('Error marking interaction as referenced:', error);
          });
        }
      });
      
      relatedQueriesContainer.appendChild(queryItem);
    });
  }
  
  /**
   * Clear all memory for the current user
   */
  async function clearMemory() {
    try {
      const response = await fetch(`/api/memory/user/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear memory');
      }
      
      // Reload recent queries
      loadRecentQueries();
      
      // Clear related queries
      relatedQueriesContainer.innerHTML = '<p class="memory-empty">No related queries</p>';
      
      return true;
    } catch (error) {
      console.error('Error clearing memory:', error);
      return false;
    }
  }
  
  /**
   * Generate a random user ID
   * @returns {string} Random user ID
   */
  function generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 15);
  }
  
  // Public API
  return {
    /**
     * Update related queries based on the current query
     * @param {string} query - The current query
     */
    updateRelatedQueries: async function(query) {
      try {
        const response = await fetch('/api/memory/related', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query,
            userId,
            limit: 5
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch related queries');
        }
        
        const data = await response.json();
        displayRelatedQueries(data.relatedInteractions || []);
      } catch (error) {
        console.error('Error updating related queries:', error);
        relatedQueriesContainer.innerHTML = '<p class="memory-error">Failed to load related queries</p>';
      }
    },
    
    /**
     * Refresh the memory panel
     */
    refresh: function() {
      loadRecentQueries();
    },
    
    /**
     * Get the current user ID
     * @returns {string} User ID
     */
    getUserId: function() {
      return userId;
    },
    
    /**
     * Clear the memory
     * @returns {Promise<boolean>} Whether the operation was successful
     */
    clearMemory: clearMemory,
    
    /**
     * Open the memory panel
     */
    openPanel: function() {
      if (!isMemoryPanelOpen) {
        toggleMemoryPanel();
      }
    },
    
    /**
     * Close the memory panel
     */
    closePanel: function() {
      if (isMemoryPanelOpen) {
        toggleMemoryPanel();
      }
    }
  };
}
