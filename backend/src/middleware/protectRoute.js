import { requireAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

const isMockMode = !ENV.CLERK_SECRET_KEY || ENV.CLERK_SECRET_KEY.startsWith("your_");

const mockAuthMiddleware = async (req, res, next) => {
  try {
    const clerkId = req.headers["x-mock-user-id"];
    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized - Mock User ID required" });
    }

    let user = await User.findOne({ clerkId });
    if (!user) {
      // Auto-upsert mock user details from headers
      const email = req.headers["x-mock-user-email"] || `${clerkId}@example.com`;
      const name = req.headers["x-mock-user-name"] || "Guest Hunter";
      const profileImage = req.headers["x-mock-user-image"] || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
      
      user = await User.create({
        clerkId,
        email,
        name,
        profileImage,
      });
      console.log("ℹ️ Created mock user in local DB:", name);
    }

    req.user = user;
    req.auth = () => ({ userId: clerkId });
    next();
  } catch (error) {
    console.error("Error in mockAuthMiddleware", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const realAuthMiddleware = async (req, res, next) => {
  try {
    const clerkId = req.auth().userId;

    if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

    // find user in db by clerk ID
    let user = await User.findOne({ clerkId });

    if (!user) {
      // Fallback auto-upsert in case Inngest syncing has delays
      try {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        user = await User.create({
          clerkId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Clerk User",
          profileImage: clerkUser.imageUrl,
        });
        console.log("ℹ️ Automatically synced user from Clerk on request:", user.name);
      } catch (syncError) {
        console.error("Failed to auto-sync user from Clerk:", syncError);
        return res.status(404).json({ message: "User not found and could not sync" });
      }
    }

    // attach user to req
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const protectRoute = isMockMode
  ? [mockAuthMiddleware]
  : [requireAuth(), realAuthMiddleware];
