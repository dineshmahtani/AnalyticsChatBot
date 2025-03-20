/**
 * Analytics Chatbot Frontend (Static Version for GitHub Pages)
 * 
 * This script handles the frontend functionality of the Analytics Chatbot,
 * including user interactions and message display.
 */

document.addEventListener('DOMContentLoaded', async () => {
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
      projectId: localStorage.getItem('bq_project_id') || 'local-testing',
      location: localStorage.getItem('bq_location') || 'local',
      dataset: localStorage.getItem('bq_dataset') || 'telus_analytics'
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

    // Process the message
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
    // Always show as configured when using local data
    const isLocalData = config.bigQuery.projectId === 'local-testing' || 
                        config.bigQuery.location === 'local' || 
                        config.bigQuery.dataset === 'telus_analytics';
    
    const isConfigured = isLocalData || (
      config.bigQuery.projectId && 
      config.bigQuery.location && 
      config.bigQuery.dataset
    );
    
    if (isConfigured) {
      if (isLocalData) {
        configStatus.textContent = 'Using Local Data';
      } else {
        configStatus.textContent = 'Configured';
      }
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
   * Process a user message (Static version for GitHub Pages)
   * @param {string} message - User message
   */
  async function processMessage(message) {
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
    
    // Simulate processing delay
    setTimeout(() => {
      // Remove loading indicator
      chatMessages.removeChild(loadingDiv);
      
      // Static responses for GitHub Pages demo
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        addMessage('Hello! I\'m the Analytics Chatbot. How can I help you today?', 'bot');
      }
      else if (lowerMessage.includes('list tables') || lowerMessage.includes('show tables')) {
        addMessage({
          type: 'tableList',
          message: 'Here are the available tables:',
          data: ['dealer_analytics']
        }, 'bot');
      }
      else if (lowerMessage.includes('schema') || lowerMessage.includes('structure')) {
        addMessage({
          type: 'tableSchema',
          message: 'Schema for table dealer_analytics:',
          data: [
            { name: 'Dealer Legal Name', type: 'STRING', mode: 'REQUIRED', description: 'Name of the dealer' },
            { name: '5209', type: 'INTEGER', mode: 'NULLABLE', description: 'Visits' },
            { name: '34655', type: 'INTEGER', mode: 'NULLABLE', description: 'Unique Visitors' }
          ]
        }, 'bot');
      }
      else if (lowerMessage.includes('top') && lowerMessage.includes('visits')) {
        addMessage({
          type: 'queryResults',
          message: 'Top 5 sales reps by visits:',
          data: {
            rows: [
              { 'Dealer Legal Name (v183)': 'boutique_telus_/_boutique_koodo', '5209': '2411' },
              { 'Dealer Legal Name (v183)': 'client_operations', '5209': '1512' },
              { 'Dealer Legal Name (v183)': 'small_business_solutions_outbound', '5209': '931' },
              { 'Dealer Legal Name (v183)': 'wal-mart_canada_corp./la_compagnie_wal-mart_du_canada', '5209': '752' },
              { 'Dealer Legal Name (v183)': 'css_outbound', '5209': '386' }
            ],
            metadata: {
              rowCount: 5
            }
          }
        }, 'bot');
      }
      else if (lowerMessage.includes('calculated') && lowerMessage.includes('field')) {
        if (lowerMessage.includes('list') || lowerMessage.includes('show')) {
          addMessage({
            type: 'text',
            message: 'Available calculated fields:\n5209_to_34655_ratio: Ratio of Visits to Unique Visitors\ntotal_metrics: Sum of all numeric metrics\naverage_metrics: Average of all numeric metrics'
          }, 'bot');
        }
        else if (lowerMessage.includes('create') || lowerMessage.includes('add')) {
          addMessage('Created calculated field successfully! You can now use it in your queries.', 'bot');
        }
        else {
          addMessage({
            type: 'text',
            message: 'To work with calculated fields, you can:\n1. List calculated fields\n2. Create a calculated field (e.g., "field1 / field2 as ratio")\n3. Use calculated fields in queries'
          }, 'bot');
        }
      }
      else if (lowerMessage.includes('select') || lowerMessage.includes('query')) {
        addMessage({
          type: 'queryResults',
          message: 'Query results:',
          data: {
            rows: [
              { 'Dealer Legal Name (v183)': 'boutique_telus_/_boutique_koodo', '5209': '2411', '34655': '9780', 'calculated_ratio': '0.2464' },
              { 'Dealer Legal Name (v183)': 'client_operations', '5209': '1512', '34655': '3529', 'calculated_ratio': '0.4285' },
              { 'Dealer Legal Name (v183)': 'small_business_solutions_outbound', '5209': '931', '34655': '2175', 'calculated_ratio': '0.4280' }
            ],
            metadata: {
              rowCount: 3
            }
          }
        }, 'bot');
      }
      else {
        addMessage("I'm sorry, this is a static demo for GitHub Pages. In the full version, I can process natural language queries and execute SQL queries against your data. Try asking about tables, schemas, or calculated fields.", 'bot');
      }
    }, 1000);
  }
});
