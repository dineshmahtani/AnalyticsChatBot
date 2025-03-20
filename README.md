# Analytics Chatbot

A chatbot interface for querying analytics data using natural language. This project allows non-technical users to ask questions about web analytics data and get meaningful responses.

## Project Overview

This is Phase 1 of an iterative development approach to build an Analytics Chatbot that can:

1. Interpret natural language queries about analytics data
2. Process and analyze the data
3. Present results in a user-friendly format

The current implementation uses a sample CSV file from Adobe Analytics as the data source. Future phases will expand to include more complex data structures and eventually integrate directly with Adobe Analytics API.

## Features

- Natural language query processing (rule-based for demo purposes)
- CSV data parsing and querying
- Chat-based user interface
- Results displayed in formatted tables
- Query interpretation and explanation

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **NLP**: Rule-based query parsing (no API key required for demo)
- **Data Processing**: CSV parsing and custom query logic

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/dineshmahtani/AnalyticsChatBot.git
   cd AnalyticsChatBot
   ```

2. Install dependencies:
   ```
   npm run install-all
   ```

### Running the Application

1. Start the server:
   ```
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Sample Queries

Try asking questions like:

- "Which sales rep has the most visits?"
- "Show me the top 5 sales reps by credit card additions"
- "What are the metrics for boutique telus?"
- "Compare visits and credit card additions for the top sales reps"

## Project Structure

```
AnalyticsChatBot/
├── client/                  # Frontend
│   ├── components/          # UI components
│   │   └── results.js       # Results display component
│   ├── index.html           # Main HTML page
│   ├── styles.css           # Styling
│   └── app.js               # Frontend logic
├── data/                    # Sample data
│   └── telus_analytics_sample.csv  # Sample CSV data
├── server/                  # Backend
│   ├── routes/              # API routes
│   │   └── api.js           # API endpoints
│   ├── services/            # Business logic
│   │   ├── nlp.js           # Natural language processing
│   │   └── queryProcessor.js # Data query logic
│   └── index.js             # Server entry point
└── README.md                # Project documentation
```

## Future Enhancements (Planned Phases)

### Phase 2: Expanded Data Variability
- Support for more complex data structures
- Advanced query capabilities
- Data visualization components

### Phase 3: Chatbot Experience
- Enhanced conversation context
- Follow-up questions
- Improved UI/UX

### Phase 4: Adobe Analytics Integration
- Direct connection to Adobe Analytics API
- Real-time data access
- Advanced analytics capabilities

## License

This project is licensed under the ISC License.
