const { MongoClient } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = "reviews";
const collectionName = "newsletter";

exports.handler = async (event, context) => {
  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    if (event.httpMethod === "GET") {
      // Retrieve reviews
      const reviews = await collection
        .find({})
        .sort({ _id: -1 })
        .limit(10)
        .toArray();
      return {
        statusCode: 200,
        body: JSON.stringify(reviews),
      };
    } else if (event.httpMethod === "POST") {
      // Add a new review
      const { name, comment, rating } = JSON.parse(event.body);
      const newReview = {
        name,
        comment,
        rating: parseInt(rating),
        date: new Date(),
      };
      await collection.insertOne(newReview);
      return {
        statusCode: 201,
        body: JSON.stringify({ message: "Review added successfully" }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Server error",
        error: error.toString(),
      }),
    };
  } finally {
    await client.close();
  }
};
