import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "../Backend/routes/auth.routs.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  res.send("Server is running");
});

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    console.log("✅ Connected to database");
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(
      "Failed to connect to the database. Server not started.",
      error
    );
  });
