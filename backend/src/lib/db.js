import mongoose from "mongoose";
import { ENV } from "./env.js";
import User from "../models/User.js";
import Session from "../models/Session.js";

// In-memory data store for Zero-Dependency fallback
const mockUsers = [];
const mockSessions = [];

const generateObjectId = () => {
  return new mongoose.Types.ObjectId();
};

const setupMockDatabase = () => {
  console.log("🛠️ Configured In-Memory Mock Database successfully!");

  // Mock User.findOne
  User.findOne = async (query) => {
    const key = Object.keys(query)[0];
    const val = query[key];
    const user = mockUsers.find(u => u[key] === val);
    return user || null;
  };

  // Mock User.create
  User.create = async (userData) => {
    const newUser = {
      _id: generateObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData
    };
    mockUsers.push(newUser);
    return newUser;
  };

  // Helper to deep populate user objects
  const populateField = (item, field) => {
    const userId = item[field];
    if (userId) {
      const user = mockUsers.find(u => u._id.toString() === userId.toString() || u.clerkId === userId);
      if (user) {
        item[field] = { ...user };
      }
    }
  };

  // Mock Session.create
  Session.create = async (sessionData) => {
    const newSession = {
      _id: generateObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
      participant: null,
      ...sessionData,
      save: async function() {
        const idx = mockSessions.findIndex(s => s._id.toString() === this._id.toString());
        if (idx !== -1) {
          mockSessions[idx] = { ...mockSessions[idx], ...this };
        }
        return this;
      }
    };
    mockSessions.push(newSession);
    return newSession;
  };

  // Mock Session.findById
  Session.findById = (id) => {
    const session = mockSessions.find(s => s._id.toString() === id.toString());
    const cloned = session ? { 
      ...session,
      save: async function() {
        const idx = mockSessions.findIndex(s => s._id.toString() === this._id.toString());
        if (idx !== -1) {
          mockSessions[idx] = { ...mockSessions[idx], ...this };
        }
        return this;
      }
    } : null;

    const chain = {
      populate: (path) => {
        if (cloned) {
          if (path.includes("host")) populateField(cloned, "host");
          if (path.includes("participant")) populateField(cloned, "participant");
        }
        return chain;
      },
      then: (resolve) => resolve(cloned),
      catch: (reject) => {}
    };
    return chain;
  };

  // Mock Session.find
  Session.find = (query) => {
    let filtered = [...mockSessions];
    if (query) {
      if (query.status) {
        filtered = filtered.filter(s => s.status === query.status);
      }
      if (query.$or) {
        const userIdStr = query.$or[0].host?.toString() || query.$or[1].participant?.toString();
        filtered = filtered.filter(s => 
          (s.host && s.host.toString() === userIdStr) || 
          (s.participant && s.participant.toString() === userIdStr)
        );
      }
    }

    let clonedResults = filtered.map(s => ({
      ...s,
      save: async function() {
        const idx = mockSessions.findIndex(x => x._id.toString() === this._id.toString());
        if (idx !== -1) {
          mockSessions[idx] = { ...mockSessions[idx], ...this };
        }
        return this;
      }
    }));

    const chain = {
      populate: (path) => {
        clonedResults.forEach(res => {
          if (path.includes("host")) populateField(res, "host");
          if (path.includes("participant")) populateField(res, "participant");
        });
        return chain;
      },
      sort: (sortObj) => {
        clonedResults.sort((a, b) => b.createdAt - a.createdAt);
        return chain;
      },
      limit: (limitNum) => {
        clonedResults = clonedResults.slice(0, limitNum);
        return chain;
      },
      then: (resolve) => resolve(clonedResults),
      catch: (reject) => {}
    };
    return chain;
  };
};

export const connectDB = async () => {
  try {
    let dbUrl = ENV.DB_URL;
    if (!dbUrl || dbUrl.includes("your_mongodb_connection_url")) {
      dbUrl = "mongodb://127.0.0.1:27017/talenthunt";
    }
    // Set low timeout (2000ms) to fallback fast if MongoDB is not running locally
    const conn = await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 2000 });
    console.log("✅ Connected to MongoDB:", conn.connection.host);
  } catch (error) {
    console.warn("⚠️ Could not connect to local MongoDB. Falling back to IN-MEMORY Database Mode.");
    setupMockDatabase();
  }
};
