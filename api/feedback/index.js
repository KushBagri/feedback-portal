const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient(process.env.COSMOS_DB_CONN);
const database = client.database("feedbackdb");
const container = database.container("feedback");

module.exports = async function (context, req) {
  try {
    if (req.method === "POST") {
      const { name, feedback } = req.body;

      if (!name || !feedback) {
        context.res = {
          status: 400,
          body: { error: "Name and feedback are required." }
        };
        return;
      }

      const item = {
        id: Date.now().toString(),
        type: "form",
        name,
        feedback,
        timestamp: new Date().toISOString()
      };

      await container.items.create(item);

      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: item
      };
    }

    if (req.method === "GET") {
      const { resources } = await container.items.readAll().fetchAll();

      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: resources
      };
    }
  } catch (err) {
    context.log.error("Feedback API error:", err.message);
    context.res = {
      status: 500,
      body: { error: "Internal server error." }
    };
  }
};
