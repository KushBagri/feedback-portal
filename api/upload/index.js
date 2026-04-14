const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient(process.env.COSMOS_DB_CONN);
const database = client.database("feedbackdb");
const container = database.container("feedback");

module.exports = async function (context, req) {
  try {
    const text = req.body;

    if (!text || typeof text !== "string") {
      context.res = {
        status: 400,
        body: { error: "Request body must be a plain text string." }
      };
      return;
    }

    function extractValue(label) {
      const regex = new RegExp(label + ": (.*)");
      const match = text.match(regex);
      return match ? match[1].trim() : "";
    }

    const name = extractValue("Name");
    const feedback = extractValue("Feedback");
    const rating = extractValue("Rating");

    if (!name && !feedback) {
      context.res = {
        status: 400,
        body: { error: "Could not parse Name or Feedback from the document." }
      };
      return;
    }

    const item = {
      id: Date.now().toString(),
      type: "document",
      name,
      feedback,
      rating,
      rawText: text,
      timestamp: new Date().toISOString()
    };

    await container.items.create(item);

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: item
    };
  } catch (err) {
    context.log.error("Upload API error:", err.message);
    context.res = {
      status: 500,
      body: { error: "Internal server error." }
    };
  }
};
