// functions/subscribe.js

const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  if (event.httpMethod === "POST") {
    const { email } = JSON.parse(event.body);
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
