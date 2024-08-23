const mongoose = require("mongoose");
const querystring = require("querystring");

// MongoDB connection string (replace with your actual connection string)
const MONGODB_URI = process.env.MONGODB_URI;

// Define a schema for the subscriber
const subscriberSchema = new mongoose.Schema({
  email: String,
  date: { type: Date, default: Date.now },
});

// Create a model based on the schema
const Subscriber = mongoose.model("Subscriber", subscriberSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

exports.handler = async (event) => {
  if (event.httpMethod === "POST") {
    let email;

    // Check if the content type is form submission (x-www-form-urlencoded)
    if (
      event.headers["content-type"].includes(
        "application/x-www-form-urlencoded"
      )
    ) {
      // Parse the URL-encoded form data
      const parsedBody = querystring.parse(event.body);
      email = parsedBody.email; // Extract the email field
    } else {
      return {
        statusCode: 400,
        body: "Unsupported content type. Expected form submission.",
      };
    }

    // Check if email was provided
    if (!email) {
      return {
        statusCode: 400,
        body: "Email is required.",
      };
    }

    try {
      // Create a new subscriber document
      const subscriber = new Subscriber({ email: email });

      // Save the subscriber to the database
      await subscriber.save();

      return {
        statusCode: 302,
        headers: {
          Location: "/thank-you.html", // Redirect to thank you page after successful submission
        },
      };
    } catch (error) {
      console.error("Error saving subscriber:", error);
      return {
        statusCode: 500,
        body: "An error occurred while saving your email.",
      };
    }
  }

  // If the HTTP method is not POST, return 405 Method Not Allowed
  return {
    statusCode: 405,
    body: "Method Not Allowed",
  };
};
