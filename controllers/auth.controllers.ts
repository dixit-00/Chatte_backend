import type { Request, Response } from "express";
import User from "../modals/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/token.js";

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password, name } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ error: "User already exists" });
      return;
    }
    user = new User({ name, email, password, avatar: "" });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    const token = generateToken(user);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error: any) {
    console.error("Error registering user:", error.message || error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = generateToken(user);
    res.status(200).json({ token });
  } catch (error: any) {
    console.error("Error logging in user:", error.message || error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
