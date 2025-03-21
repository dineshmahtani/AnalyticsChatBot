# Analytics Chatbot

A natural language interface for querying BigQuery data. This chatbot allows users to ask questions about their data in plain English and get visualized results.

## Features

- Natural language processing to convert English queries to SQL
- Support for querying BigQuery datasets
- Visualization of query results
- Calculated fields for custom metrics
- Statistical operations on ratios (average, median, etc.)
- Query interpretation display for better transparency
- Memory system to recall previous queries
- Responsive design that works on desktop and mobile

## Demo

A static demo version is available on GitHub Pages: [https://dineshmahtani.github.io/AnalyticsChatBot/](https://dineshmahtani.github.io/AnalyticsChatBot/)

The demo version simulates responses to common queries such as:
- "List all tables"
- "Show me the schema of dealer_analytics"
- "What are the top 5 sales reps by visits?"
- "Create a calculated field 5209 / 34655 as ratio"
- "List calculated fields"

## Project Structure

- `/src` - Source code for the full application
  - `/src/services` - Backend services for data processing
  - `/src/app.js` - Main application logic
  - `/src/chatbot.js` - Chatbot implementation
- `/server` - Backend server implementation
  - `/server/services` - Server-side services including NLP
- `/scripts` - Utility scripts
- `/config` - Configuration files
- `/docs` - Documentation
  - `/docs/feature-updates.md` - Details on recent feature updates

## Recent Updates

The Analytics Chatbot has been enhanced with two major features:

1. **Statistical Operations on Ratios**: The chatbot can now perform statistical operations (average, median, etc.) on ratio calculations, enabling more complex analytical queries.

2. **Query Interpretation Display**: The system now shows how it interpreted your query, making it easier to understand results and formulate effective queries.

For more details, see [Feature Updates Documentation](docs/feature-updates.md).

## Local Development

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Access to BigQuery (for full functionality)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/dineshmahtani/AnalyticsChatBot.git
   cd AnalyticsChatBot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure BigQuery access (optional):
   - Update `config/default.json` with your BigQuery credentials
   - Or use the configuration panel in the UI

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser to `http://localhost:3000`

## Usage

1. Type your query in natural language in the chat input
2. The chatbot will process your query and display the results
3. For complex queries, you can use calculated fields

Example queries:
- "What are the top 10 dealers by visits?"
- "Show me the conversion rate for each region"
- "Create a calculated field visits / sales as efficiency"
- "What's the average efficiency for the top 5 dealers?"

## License

MIT
