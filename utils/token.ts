import type { UserProps } from "../types.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

export const generateToken = (user: UserProps) => {
  const payload = {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
  };
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });
};
