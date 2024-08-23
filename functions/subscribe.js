const fs = require("fs");
const path = require("path");
const querystring = require("querystring");

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

    const data = `Email: ${email}\n`;
    const filePath = path.join(__dirname, "../subscribers.txt");

    try {
      // Append the email to the subscribers.txt file
      fs.appendFileSync(filePath, data);
      return {
        statusCode: 302,
        headers: {
          Location: "/thank-you.html", // Redirect to thank you page after successful submission
        },
      };
    } catch (error) {
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
