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
    const statistics = results.statistics || null;
    const combinedResults = results.combinedResults || false;
    const topResults = results.topResults || [];
    const bottomResults = results.bottomResults || [];
    
    if (data.length === 0 && !statistics && !combinedResults) {
      addMessage('I couldn\'t find any data matching your query.', 'bot');
      return;
    }
    
    // Create a response with query interpretation and results
    let responseHtml = '';
    
    // Add query interpretation if available
    if (query.intent) {
      const intentDisplay = query.intent === 'compare_top_bottom' ? 
        'compare top and bottom results' : 
        query.intent.replace(/_/g, ' ');
      responseHtml += `<div class="query-interpretation">I understood you wanted to ${intentDisplay}</div>`;
    }
    
    // Add statistical results if available
    if (statistics) {
      responseHtml += `<div class="statistical-result">${statistics.description}</div>`;
      
      // Add additional context for statistical results
      if (statistics.operation === 'correlation') {
        responseHtml += `<div class="statistical-note">
          <p>Correlation coefficient ranges from -1 to 1:</p>
          <ul>
            <li>1: Perfect positive correlation</li>
            <li>0: No correlation</li>
            <li>-1: Perfect negative correlation</li>
          </ul>
        </div>`;
      }
    }
    
    // Add explanation for combined results
    if (combinedResults && topResults.length > 0 && bottomResults.length > 0) {
      // Import the createResultsExplanation function from results.js
      if (typeof createResultsExplanation === 'function') {
        const explanation = createResultsExplanation(null, query, statistics, combinedResults, topResults, bottomResults);
        if (explanation) {
          responseHtml += explanation;
        }
      }
    }
    
    // Handle combined top and bottom results
    if (combinedResults) {
      if (topResults.length > 0) {
        responseHtml += `<h3 class="results-section-title">Top ${topResults.length} Results</h3>`;
        responseHtml += createResultsTable(topResults);
      }
      
      if (bottomResults.length > 0) {
        responseHtml += `<h3 class="results-section-title">Bottom ${bottomResults.length} Results</h3>`;
        responseHtml += createResultsTable(bottomResults);
      }
    }
    // Add regular results table and explanation
    else if (data.length > 0) {
      // Add explanation for regular results
      if (typeof createResultsExplanation === 'function') {
        const explanation = createResultsExplanation(data, query, statistics);
        if (explanation) {
          responseHtml += explanation;
        }
      }
      
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
    
    const allHeaders = Object.keys(data[0]);
    
    // Determine if we have a ratio calculation
    const hasRatio = allHeaders.includes('calculated_ratio');
    const ratioLabel = hasRatio && data[0].ratio_label ? data[0].ratio_label : 'Ratio';
    
    // Filter out ratio_label from headers if present, but keep calculated_ratio
    const headers = allHeaders.filter(header => header !== 'ratio_label');
    
    let tableHtml = '<table class="results-table"><thead><tr>';
    
    // Table headers
    headers.forEach(header => {
      // For calculated_ratio, use the dynamic ratio label from the first row
      const headerText = (header === 'calculated_ratio' && hasRatio) ? ratioLabel : formatHeader(header);
      tableHtml += `<th>${headerText}</th>`;
    });
    
    tableHtml += '</tr></thead><tbody>';
    
    // Table rows
    data.forEach(row => {
      tableHtml += '<tr>';
      headers.forEach(header => {
        tableHtml += `<td>${formatValue(row[header], header)}</td>`;
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
    if (header === 'salesRep') return 'Sales Representative';
    
    // Map column names to display names
    const displayNames = {
      "_1": "Credit Card Additions",
      "_2": "Order Confirmations",
      "﻿#=================================================================": "Sales Representative"
    };
    
    // Check if we have a display name mapping
    if (displayNames[header]) {
      return displayNames[header];
    }
    
    // Handle calculated ratio
    if (header === 'calculated_ratio') {
      return 'Ratio';
    }
    
    return header
      .replace(/_/g, ' ')
      .replace(/>/g, ' - ')
      .replace(/:/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  
  /**
   * Format a value for display
   * @param {any} value - The value to format
   * @param {string} header - The header name
   * @returns {string} Formatted value
   */
  function formatValue(value, header) {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'number') {
      // Format ratio with more decimal places
      if (header === 'calculated_ratio') {
        return value.toFixed(4);
      }
      
      // Format large numbers with commas
      return value.toLocaleString();
    }
    
    return value;
  }
});
