import { Schema } from "mongoose";
import type { ConversationProps } from "../types.js";
import { model } from "mongoose";

const ConversationsSchema = new Schema<ConversationProps>(
  {
    type: {
      type: String,
      enum: ["private", "group", "direct"],
      required: true,
    },
    name: String,
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },

    avatar: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ConversationsSchema.pre("save", async function () {
  this.updatedAt = new Date();
});

export default model<ConversationProps>("Conversations", ConversationsSchema);
