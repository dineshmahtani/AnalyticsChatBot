document.addEventListener('DOMContentLoaded', () => {
  const queryForm = document.getElementById('query-form');
  const queryInput = document.getElementById('query-input');
  const chatMessages = document.getElementById('chat-messages');
  
  // Add event listener for form submission
  queryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const query = queryInput.value.trim();
    if (!query) return;
    
    // Add user message to chat
    addMessage(query, 'user');
    
    // Clear input
    queryInput.value = '';
    
    // Add loading indicator
    const loadingId = addLoadingMessage();
    
    try {
      // Send query to API
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Remove loading indicator
      removeLoadingMessage(loadingId);
      
      // Display results
      displayResults(data.results);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Remove loading indicator
      removeLoadingMessage(loadingId);
      
      // Display error message
      addMessage('Sorry, I encountered an error processing your request. Please try again.', 'bot');
    }
  });
  
  /**
   * Add a message to the chat
   * @param {string} content - Message content
   * @param {string} sender - 'user' or 'bot'
   */
  function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    if (sender === 'bot' && typeof content === 'object') {
      // Handle complex bot responses (like tables)
      messageContent.innerHTML = content.html;
    } else {
      // Handle simple text messages
      messageContent.textContent = content;
    }
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  /**
   * Add a loading message to the chat
   * @returns {string} ID of the loading message element
   */
  function addLoadingMessage() {
    const id = 'loading-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.id = id;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content loading';
    messageContent.innerHTML = `
      Thinking
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return id;
  }
  
  /**
   * Remove a loading message from the chat
   * @param {string} id - ID of the loading message element
   */
  function removeLoadingMessage(id) {
    const loadingMessage = document.getElementById(id);
    if (loadingMessage) {
      loadingMessage.remove();
    }
  }
  
  /**
   * Display query results in the chat
   * @param {Object} results - The query results
   */
  function displayResults(results) {
    if (!results) {
      addMessage('I couldn\'t find any data matching your query.', 'bot');
      return;
    }
    
    const query = results.query || {};
    const data = results.results || [];
    
    if (data.length === 0) {
      addMessage('I couldn\'t find any data matching your query.', 'bot');
      return;
    }
    
    // Create a response with query interpretation and results
    let responseHtml = '';
    
    // Add query interpretation if available
    if (query.intent) {
      responseHtml += `<div class="query-interpretation">I understood you wanted to ${query.intent.replace(/_/g, ' ')}</div>`;
    }
    
    // Add results table
    if (data.length > 0) {
      responseHtml += createResultsTable(data);
    }
    
    // Add the response to the chat
    addMessage({ html: responseHtml }, 'bot');
  }
  
  /**
   * Create an HTML table from the results data
   * @param {Array} data - Array of data objects
   * @returns {string} HTML table
   */
  function createResultsTable(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    
    let tableHtml = '<table class="results-table"><thead><tr>';
    
    // Table headers
    headers.forEach(header => {
      tableHtml += `<th>${formatHeader(header)}</th>`;
    });
    
    tableHtml += '</tr></thead><tbody>';
    
    // Table rows
    data.forEach(row => {
      tableHtml += '<tr>';
      headers.forEach(header => {
        tableHtml += `<td>${formatValue(row[header])}</td>`;
      });
      tableHtml += '</tr>';
    });
    
    tableHtml += '</tbody></table>';
    
    return tableHtml;
  }
  
  /**
   * Format a header for display
   * @param {string} header - The header name
   * @returns {string} Formatted header
   */
  function formatHeader(header) {
    if (header === 'dealer') return 'Dealer';
    
    // Handle special case for the credit card metric
    if (header.includes('pap_added:credit_card')) {
      return 'Credit Card Additions';
    }
    
    return header
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  
  /**
   * Format a value for display
   * @param {any} value - The value to format
   * @returns {string} Formatted value
   */
  function formatValue(value) {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'number') {
      // Format large numbers with commas
      return value.toLocaleString();
    }
    
    return value;
  }
});
