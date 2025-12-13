import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async (): Promise<void> => {
  const mongoUrl = process.env.MONGO_URL?.trim();

  if (!mongoUrl) {
    console.error("❌ MONGO_URL is missing in .env");
    throw new Error("MONGO_URL not provided");
  }

  const hasValidScheme =
    mongoUrl.startsWith("mongodb://") || mongoUrl.startsWith("mongodb+srv://");
  if (!hasValidScheme) {
    console.error("❌ MONGO_URL must start with mongodb:// or mongodb+srv://");
    throw new Error("Invalid MongoDB connection string scheme");
  }

  // Redact password when logging
  const redacted = mongoUrl.replace(/\/\/([^:]+):([^@]+)@/, "//$1:<hidden>@");
  console.log(`🔌 Connecting to MongoDB at ${redacted}`);

  try {
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
  } catch (error: any) {
    console.error("❌ Error connecting to database:", error.message || error);
    throw error;
  }
};

export default connectDB;
