import { StreamChat } from "stream-chat";
import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";

const apiKey = ENV.STREAM_API_KEY;
const apiSecret = ENV.STREAM_API_SECRET;

const isStreamMock = !apiKey || !apiSecret || apiKey.startsWith("your_") || apiSecret.startsWith("your_");

if (isStreamMock) {
  console.log("ℹ️ Stream API key or secret is missing. Running Stream client in Mock Mode.");
}

export const chatClient = isStreamMock ? null : StreamChat.getInstance(apiKey, apiSecret);
export const streamClient = isStreamMock ? null : new StreamClient(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  if (isStreamMock) return;
  try {
    await chatClient.upsertUser(userData);
    console.log("Stream user upserted successfully:", userData);
  } catch (error) {
    console.error("Error upserting Stream user:", error);
  }
};

export const deleteStreamUser = async (userId) => {
  if (isStreamMock) return;
  try {
    await chatClient.deleteUser(userId);
    console.log("Stream user deleted successfully:", userId);
  } catch (error) {
    console.error("Error deleting the Stream user:", error);
  }
};
