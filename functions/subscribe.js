const mongoose = require("mongoose");
const querystring = require("querystring");

// MongoDB connection string (use environment variable)
const MONGODB_URI = process.env.MONGODB_URI;

// Define a schema for the subscriber with name and email fields
const subscriberSchema = new mongoose.Schema({
  name: String, // Add the name field
  email: String,
  date: { type: Date, default: Date.now },
});

// Create a model based on the schema
const Subscriber = mongoose.model("Subscriber", subscriberSchema);

exports.handler = async (event) => {
  console.log("Function invoked");

  if (event.httpMethod !== "POST") {
    console.log("Method not allowed");
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  let email, name;

  // Check if the content type is form submission (x-www-form-urlencoded)
  if (
    event.headers["content-type"].includes("application/x-www-form-urlencoded")
  ) {
    // Parse the URL-encoded form data
    const parsedBody = querystring.parse(event.body);
    email = parsedBody.email; // Extract the email field
    name = parsedBody.name; // Extract the name field
  } else {
    console.log("Unsupported content type");
    return {
      statusCode: 400,
      body: "Unsupported content type. Expected form submission.",
    };
  }

  // Check if both name and email were provided
  if (!email || !name) {
    console.log("Name and Email are required");
    return {
      statusCode: 400,
      body: "Name and Email are required.",
    };
  }

  console.log("Attempting to connect to database");
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to database");

    // Create a new subscriber document with both name and email
    const subscriber = new Subscriber({ name: name, email: email });

    // Save the subscriber to the database
    await subscriber.save();
    console.log("Subscriber saved:", name, email);

    await mongoose.connection.close();
    console.log("Database connection closed");

    return {
      statusCode: 302,
      headers: {
        Location: "/thank-you.html", // Redirect to thank you page after successful submission
      },
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: "An error occurred while saving your data.",
    };
  }
};
