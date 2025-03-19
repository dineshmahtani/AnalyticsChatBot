const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here' // Replace with your actual API key or use environment variable
});

/**
 * Parse a natural language query into structured parameters
 * @param {string} query - The natural language query
 * @returns {Object} Structured query parameters
 */
async function parseQuery(query) {
  try {
    const systemPrompt = `
You are an analytics assistant specialized in Adobe Analytics data for TELUS. 
Parse the user's natural language query about website analytics into a structured JSON format.

The available data has the following structure:
- Dealer Legal Name (v183): The name of the dealer
- pap_added:credit_cardcse>mobility_sales>order_confirmation: A metric tracking credit card additions
- Visits: Number of visits to the website

Return a JSON object with the following structure:
{
  "intent": "The general intent of the query (e.g., 'get_metric', 'compare_dealers', 'find_top')",
  "metrics": ["Array of metrics to retrieve"],
  "filters": {
    "dealer": "Specific dealer name if mentioned",
    "other_filters": "Any other filters mentioned"
  },
  "limit": "Number of results to return if specified",
  "sort": {
    "by": "Metric to sort by",
    "order": "asc or desc"
  }
}

Only include properties that are relevant to the query. If a property is not mentioned, omit it from the response.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error in NLP processing:', error);
    throw new Error(`Failed to parse query: ${error.message}`);
  }
}

module.exports = {
  parseQuery
};
