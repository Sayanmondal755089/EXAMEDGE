import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/examedge";

    await mongoose.connect(uri);

    isConnected = true;

    console.log(
      "✅ MongoDB connected:",
      uri.includes("@") ? uri.split("@")[1] : uri
    );
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Reconnecting...");
  isConnected = false;
  setTimeout(connectDB, 5000);
});
