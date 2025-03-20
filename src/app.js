/**
 * Analytics Chatbot Frontend
 * 
 * This script handles the frontend functionality of the Analytics Chatbot,
 * including user interactions, message display, and configuration management.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatMessages = document.getElementById('chat-messages');
  const configForm = document.getElementById('config-form');
  const projectIdInput = document.getElementById('project-id');
  const locationInput = document.getElementById('location');
  const datasetInput = document.getElementById('dataset');
  const configStatus = document.getElementById('config-status');

  // Configuration state
  let config = {
    bigQuery: {
      projectId: localStorage.getItem('bq_project_id') || '',
      location: localStorage.getItem('bq_location') || '',
      dataset: localStorage.getItem('bq_dataset') || ''
    }
  };

  // Initialize configuration form with saved values
  projectIdInput.value = config.bigQuery.projectId;
  locationInput.value = config.bigQuery.location;
  datasetInput.value = config.bigQuery.dataset;

  // Update configuration status display
  updateConfigStatus();

  // Event Listeners
  chatForm.addEventListener('submit', handleChatSubmit);
  configForm.addEventListener('submit', handleConfigSubmit);

  /**
   * Handle chat form submission
   * @param {Event} e - Form submit event
   */
  function handleChatSubmit(e) {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // Display user message
    addMessage(message, 'user');
    
    // Clear input
    userInput.value = '';

    // Process the message (in a real app, this would call the backend)
    processMessage(message);
  }

  /**
   * Handle configuration form submission
   * @param {Event} e - Form submit event
   */
  function handleConfigSubmit(e) {
    e.preventDefault();
    
    // Update configuration
    config.bigQuery.projectId = projectIdInput.value.trim();
    config.bigQuery.location = locationInput.value.trim();
    config.bigQuery.dataset = datasetInput.value.trim();
    
    // Save to localStorage
    localStorage.setItem('bq_project_id', config.bigQuery.projectId);
    localStorage.setItem('bq_location', config.bigQuery.location);
    localStorage.setItem('bq_dataset', config.bigQuery.dataset);
    
    // Update status
    updateConfigStatus();
    
    // Notify user
    addMessage('Configuration updated successfully!', 'bot');
  }

  /**
   * Update the configuration status display
   */
  function updateConfigStatus() {
    const isConfigured = config.bigQuery.projectId && 
                         config.bigQuery.location && 
                         config.bigQuery.dataset;
    
    if (isConfigured) {
      configStatus.textContent = 'Configured';
      configStatus.classList.add('configured');
    } else {
      configStatus.textContent = 'Not Configured';
      configStatus.classList.remove('configured');
    }
  }

  /**
   * Add a message to the chat display
   * @param {string} text - Message text
   * @param {string} sender - Message sender ('user' or 'bot')
   */
  function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    // Simple text message
    if (typeof text === 'string') {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      contentDiv.appendChild(paragraph);
    } 
    // Complex message object
    else if (typeof text === 'object') {
      // Handle different response types
      switch (text.type) {
        case 'tableList':
          const listPara = document.createElement('p');
          listPara.textContent = text.message;
          contentDiv.appendChild(listPara);
          
          const list = document.createElement('ul');
          text.data.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = item;
            list.appendChild(listItem);
          });
          contentDiv.appendChild(list);
          break;
          
        case 'tableSchema':
          const schemaPara = document.createElement('p');
          schemaPara.textContent = text.message;
          contentDiv.appendChild(schemaPara);
          
          const table = document.createElement('table');
          
          // Table header
          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          ['Name', 'Type', 'Mode', 'Description'].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);
          
          // Table body
          const tbody = document.createElement('tbody');
          text.data.forEach(field => {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = field.name;
            row.appendChild(nameCell);
            
            const typeCell = document.createElement('td');
            typeCell.textContent = field.type;
            row.appendChild(typeCell);
            
            const modeCell = document.createElement('td');
            modeCell.textContent = field.mode;
            row.appendChild(modeCell);
            
            const descCell = document.createElement('td');
            descCell.textContent = field.description || '';
            row.appendChild(descCell);
            
            tbody.appendChild(row);
          });
          table.appendChild(tbody);
          contentDiv.appendChild(table);
          break;
          
        case 'queryResults':
          const resultsPara = document.createElement('p');
          resultsPara.textContent = text.message;
          contentDiv.appendChild(resultsPara);
          
          if (text.data.rows && text.data.rows.length > 0) {
            const resultsTable = document.createElement('table');
            
            // Table header
            const rthead = document.createElement('thead');
            const rheaderRow = document.createElement('tr');
            
            // Get column names from the first row
            Object.keys(text.data.rows[0]).forEach(key => {
              const th = document.createElement('th');
              th.textContent = key;
              rheaderRow.appendChild(th);
            });
            
            rthead.appendChild(rheaderRow);
            resultsTable.appendChild(rthead);
            
            // Table body
            const rtbody = document.createElement('tbody');
            text.data.rows.forEach(row => {
              const dataRow = document.createElement('tr');
              
              Object.values(row).forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value;
                dataRow.appendChild(cell);
              });
              
              rtbody.appendChild(dataRow);
            });
            
            resultsTable.appendChild(rtbody);
            contentDiv.appendChild(resultsTable);
            
            // Add row count
            if (text.data.metadata && text.data.metadata.rowCount) {
              const countPara = document.createElement('p');
              countPara.textContent = `${text.data.metadata.rowCount} rows returned`;
              countPara.classList.add('note');
              contentDiv.appendChild(countPara);
            }
          } else {
            const noPara = document.createElement('p');
            noPara.textContent = 'No results found';
            contentDiv.appendChild(noPara);
          }
          break;
          
        case 'error':
          const errorPara = document.createElement('p');
          errorPara.textContent = text.message;
          errorPara.classList.add('error');
          contentDiv.appendChild(errorPara);
          break;
          
        default:
          const defaultPara = document.createElement('p');
          defaultPara.textContent = text.message || 'Unknown response';
          contentDiv.appendChild(defaultPara);
      }
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Process a user message
   * @param {string} message - User message
   */
  function processMessage(message) {
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'bot');
    
    const loadingContent = document.createElement('div');
    loadingContent.classList.add('message-content');
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.classList.add('loading');
    
    const loadingText = document.createElement('span');
    loadingText.textContent = 'Thinking...';
    
    loadingContent.appendChild(loadingIndicator);
    loadingContent.appendChild(loadingText);
    loadingDiv.appendChild(loadingContent);
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // In a real application, this would call the backend API
    // For this demo, we'll simulate a response after a delay
    setTimeout(() => {
      // Remove loading indicator
      chatMessages.removeChild(loadingDiv);
      
      // Process the message based on keywords (simulating the backend)
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('list tables') || lowerMessage.includes('show tables')) {
        addMessage({
          type: 'tableList',
          message: 'Here are the available tables:',
          data: ['sample_table_1', 'sample_table_2', 'sample_table_3']
        }, 'bot');
      } 
      else if (lowerMessage.includes('schema') || lowerMessage.includes('structure')) {
        const tableMatch = lowerMessage.match(/schema (?:of|for)? (\w+)/i) || 
                          lowerMessage.match(/structure (?:of|for)? (\w+)/i) ||
                          lowerMessage.match(/(\w+) schema/i);
        
        if (tableMatch && tableMatch[1]) {
          const tableName = tableMatch[1];
          addMessage({
            type: 'tableSchema',
            message: `Schema for table ${tableName}:`,
            data: [
              { name: 'id', type: 'INTEGER', mode: 'REQUIRED', description: 'Unique identifier' },
              { name: 'name', type: 'STRING', mode: 'REQUIRED', description: 'Name field' },
              { name: 'created_at', type: 'TIMESTAMP', mode: 'NULLABLE', description: 'Creation timestamp' }
            ]
          }, 'bot');
        } else {
          addMessage({
            type: 'error',
            message: 'Please specify a table name to get its schema.'
          }, 'bot');
        }
      }
      else if (lowerMessage.includes('select') || lowerMessage.includes('query')) {
        addMessage({
          type: 'queryResults',
          message: 'Query results:',
          data: {
            rows: [
              { id: 1, name: 'Sample Data 1', created_at: '2025-03-15T10:30:00Z' },
              { id: 2, name: 'Sample Data 2', created_at: '2025-03-16T14:45:00Z' }
            ],
            metadata: {
              schema: [
                { name: 'id', type: 'INTEGER' },
                { name: 'name', type: 'STRING' },
                { name: 'created_at', type: 'TIMESTAMP' }
              ],
              rowCount: 2
            }
          }
        }, 'bot');
      }
      else {
        addMessage({
          type: 'text',
          message: "I'm not sure how to answer that. Try asking about tables, schemas, or running a query."
        }, 'bot');
      }
    }, 1000);
  }
});
