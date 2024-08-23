const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  if (event.httpMethod === "POST") {
    if (!event.body) {
      return {
        statusCode: 400,
        body: "No data provided",
      };
    }

    let email;
    try {
      const parsedBody = JSON.parse(event.body);
      email = parsedBody.email;
    } catch (error) {
      return {
        statusCode: 400,
        body: "Invalid JSON input",
      };
    }

    const data = `Email: ${email}\n`;
    const filePath = path.join(__dirname, "../subscribers.txt");

    try {
      fs.appendFileSync(filePath, data);
      return {
        statusCode: 302,
        headers: {
          Location: "/thank-you.html",
        },
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: "An error occurred while saving your email.",
      };
    }
  }

  return {
    statusCode: 405,
    body: "Method Not Allowed",
  };
};
