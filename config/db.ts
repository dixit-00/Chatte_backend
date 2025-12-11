import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URL as string);
  } catch (error: any) {
    console.error("❌ Error connecting to database:", error.message || error);
    throw error;
  }
};

export default connectDB;
