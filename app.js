/**
 * Analytics Chatbot Frontend (Static GitHub Pages Version)
 * 
 * This script handles the frontend functionality of the Analytics Chatbot,
 * including user interactions and message display for the static demo.
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
      projectId: localStorage.getItem('bq_project_id') || 'demo-project',
      location: localStorage.getItem('bq_location') || 'us-central1',
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
    addMessage('Configuration updated successfully! (Note: This is a static demo, so no actual connection is made)', 'bot');
  }

  /**
   * Update the configuration status display
   */
  function updateConfigStatus() {
    configStatus.textContent = 'Demo Mode';
    configStatus.classList.add('configured');
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
   * Process a user message for the static demo
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
    
    // Simulate processing delay
    setTimeout(() => {
      // Remove loading indicator
      chatMessages.removeChild(loadingDiv);
      
      // Process the message based on keywords (static demo)
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('list') && lowerMessage.includes('table')) {
        addMessage({
          type: 'tableList',
          message: 'Here are the available tables:',
          data: ['dealer_analytics', 'sales_data', 'customer_metrics', 'product_inventory']
        }, 'bot');
      }
      else if (lowerMessage.includes('schema') && lowerMessage.includes('dealer_analytics')) {
        addMessage({
          type: 'tableSchema',
          message: 'Schema for table dealer_analytics:',
          data: [
            { name: 'dealer_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique dealer identifier' },
            { name: 'dealer', type: 'STRING', mode: 'REQUIRED', description: 'Dealer name' },
            { name: '5209', type: 'INTEGER', mode: 'NULLABLE', description: 'Number of visits' },
            { name: '34655', type: 'INTEGER', mode: 'NULLABLE', description: 'Number of sales' },
            { name: 'region', type: 'STRING', mode: 'NULLABLE', description: 'Geographic region' },
            { name: 'last_updated', type: 'TIMESTAMP', mode: 'NULLABLE', description: 'Last update timestamp' }
          ]
        }, 'bot');
      }
      else if (lowerMessage.includes('top') && lowerMessage.includes('sales') && lowerMessage.includes('visit')) {
        addMessage({
          type: 'queryResults',
          message: 'Top 5 sales reps by visits:',
          data: {
            rows: [
              { dealer_id: 'D1001', dealer: 'TELUS Mobility', '5209': 1250, '34655': 450, region: 'West' },
              { dealer_id: 'D1002', dealer: 'Rogers Wireless', '5209': 1100, '34655': 420, region: 'East' },
              { dealer_id: 'D1003', dealer: 'Bell Mobility', '5209': 980, '34655': 380, region: 'Central' },
              { dealer_id: 'D1004', dealer: 'Freedom Mobile', '5209': 850, '34655': 320, region: 'West' },
              { dealer_id: 'D1005', dealer: 'Koodo Mobile', '5209': 820, '34655': 310, region: 'East' }
            ],
            metadata: { rowCount: 5 }
          }
        }, 'bot');
      }
      else if (lowerMessage.includes('calculated') && lowerMessage.includes('field')) {
        if (lowerMessage.includes('list')) {
          addMessage({
            type: 'text',
            message: 'Available calculated fields:\nconversion_rate: 34655 / 5209\nvisit_efficiency: 5209 / total_hours'
          }, 'bot');
        }
        else if (lowerMessage.includes('create') || lowerMessage.includes('add')) {
          addMessage({
            type: 'text',
            message: 'Created calculated field! (Note: This is a static demo, so the field is not actually stored)'
          }, 'bot');
        }
        else {
          addMessage({
            type: 'text',
            message: 'To work with calculated fields, you can:\n1. List calculated fields\n2. Create a calculated field (e.g., "field1 / field2 as ratio")\n3. Use calculated fields in queries'
          }, 'bot');
        }
      }
      else if (lowerMessage.includes('cse') && lowerMessage.includes('mobility_sales') && lowerMessage.includes('getting_started')) {
        addMessage({
          type: 'queryResults',
          message: 'Top 5 sales reps by CSE>Mobility_Sales>Getting_Started:',
          data: {
            rows: [
              { dealer_id: 'D2001', dealer: 'TELUS Flagship Store', 'cse>mobility_sales>getting_started': 95, region: 'West' },
              { dealer_id: 'D2002', dealer: 'TELUS Authorized Dealer', 'cse>mobility_sales>getting_started': 92, region: 'Central' },
              { dealer_id: 'D2003', dealer: 'TELUS Corporate Store', 'cse>mobility_sales>getting_started': 88, region: 'East' },
              { dealer_id: 'D2004', dealer: 'TELUS Express Kiosk', 'cse>mobility_sales>getting_started': 85, region: 'West' },
              { dealer_id: 'D2005', dealer: 'TELUS Partner Location', 'cse>mobility_sales>getting_started': 82, region: 'Central' }
            ],
            metadata: { rowCount: 5 }
          }
        }, 'bot');
      }
      else {
        addMessage({
          type: 'text',
          message: "I'm a static demo version of the Analytics Chatbot. Try asking me about:\n- List all tables\n- Show me the schema of dealer_analytics\n- What are the top 5 sales reps by visits?\n- Create a calculated field 5209 / 34655 as ratio\n- List calculated fields"
        }, 'bot');
      }
    }, 1000);
  }
});
