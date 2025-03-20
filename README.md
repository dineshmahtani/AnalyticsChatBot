# Analytics Chatbot

A chatbot interface for querying Google BigQuery data using natural language.

## Overview

The Analytics Chatbot provides a user-friendly interface to interact with your BigQuery datasets. It allows users to:

- List available tables in a dataset
- View table schemas
- Execute SQL queries
- Ask questions in natural language (basic implementation)

## Project Structure

```
AnalyticsChatBot/
├── config/
│   └── mcp/
│       └── bigquery-config.json  # BigQuery MCP server configuration
├── scripts/
│   └── setup-bigquery-mcp.js     # Script to set up the BigQuery MCP server
├── src/
│   ├── services/
│   │   └── bigquery-service.js   # Service for interacting with BigQuery
│   ├── app.js                    # Frontend JavaScript
│   ├── chatbot.js                # Chatbot logic
│   ├── index.html                # Main HTML page
│   └── styles.css                # CSS styles
└── README.md                     # This file
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Google Cloud Platform account with BigQuery access
- BigQuery dataset

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/dineshmahtani/AnalyticsChatBot.git
   cd AnalyticsChatBot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the BigQuery MCP server:
   - Update the `config/mcp/bigquery-config.json` file with your GCP project details:
     ```json
     {
       "gcp": {
         "project_id": "YOUR_GCP_PROJECT_ID",
         "location": "YOUR_GCP_LOCATION",
         "dataset": "YOUR_BIGQUERY_DATASET"
       },
       "mcp": {
         "server_name": "bigquery",
         "command": "uv",
         "args": [
           "--directory",
           "/Users/dinesh/Documents/Cline/MCP/mcp-server-bigquery",
           "run",
           "mcp-server-bigquery",
           "--project",
           "YOUR_GCP_PROJECT_ID",
           "--location",
           "YOUR_GCP_LOCATION",
           "--dataset",
           "YOUR_BIGQUERY_DATASET"
         ]
       }
     }
     ```

4. Run the setup script to configure the MCP server:
   ```
   node scripts/setup-bigquery-mcp.js
   ```

5. Start the application:
   ```
   cd src
   open index.html
   ```

## Usage

### Web Interface

The web interface provides a chat-like experience for interacting with your BigQuery data:

1. **Configuration Panel**: Enter your GCP project details in the configuration panel on the right side of the screen.

2. **Chat Interface**: Use the chat input at the bottom of the screen to ask questions about your data.

### Example Queries

- **List tables**: "List all tables" or "Show tables"
- **View schema**: "Show schema of table_name" or "What's the structure of table_name?"
- **Execute query**: "SELECT * FROM table_name LIMIT 10"
- **Natural language**: "Show me the top 10 records from table_name"

## Updating GCP Configuration

When you receive your GCP dataset details, you'll need to update the configuration:

1. Edit the `config/mcp/bigquery-config.json` file with your actual GCP details:
   - `project_id`: Your GCP project ID
   - `location`: The location of your BigQuery dataset (e.g., "us-central1")
   - `dataset`: The name of your BigQuery dataset

2. Run the setup script to update the MCP server configuration:
   ```
   node scripts/setup-bigquery-mcp.js
   ```

3. Restart VS Code to apply the changes.

4. You can also update the configuration through the web interface by entering your GCP details in the configuration panel.

## Development

### Adding New Features

To extend the chatbot's capabilities:

1. **Enhance Natural Language Processing**: Modify the `processQuery` method in `src/chatbot.js` to handle more complex queries.

2. **Add New Query Types**: Extend the `BigQueryService` class in `src/services/bigquery-service.js` with additional methods for specific query types.

3. **Improve UI**: Enhance the user interface in `src/index.html` and `src/styles.css`.

### Testing

The project includes mock data for testing without a live BigQuery connection. To test with real data:

1. Configure your GCP details as described in the "Updating GCP Configuration" section.

2. Modify the `BigQueryService` class to use the actual MCP tool calls instead of the mock data.

## Troubleshooting

### Common Issues

- **MCP Server Not Connected**: Ensure the MCP server is properly configured and VS Code has been restarted.

- **Authentication Errors**: Verify your GCP credentials and project access permissions.

- **Query Errors**: Check your SQL syntax and ensure the tables you're querying exist in your dataset.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
