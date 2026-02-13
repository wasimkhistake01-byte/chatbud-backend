const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Firebase Service Account placeholder
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "YOUR_FIREBASE_DATABASE_URL"
});

const db = admin.database();

// Razorpay webhook secret placeholder
const RAZORPAY_WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET";

app.post("/razorpay-webhook", async (req, res) => {

  const signature = req.headers["x-razorpay-signature"];

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).send("Invalid signature");
  }

  const event = req.body.event;

  if (event === "subscription.activated") {

    const subscription = req.body.payload.subscription.entity;
    const userId = subscription.notes.userId;

    await db.ref(`users/${userId}`).update({
      subscription: "premium"
    });

    console.log("User upgraded:", userId);
  }

  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.send("ChatBud Backend Running");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running");
});
