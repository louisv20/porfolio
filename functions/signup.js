// functions/signup.js

const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    await client.connect();
    const database = client.db("newsletter");
    const users = database.collection("registered");

    const { email, password } = JSON.parse(event.body);

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "User already exists" }),
      };
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user in MongoDB
    const result = await users.insertOne({ email, password: hashedPassword });

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertedId.toString(), email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User created successfully", token }),
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  } finally {
    await client.close();
  }
};
