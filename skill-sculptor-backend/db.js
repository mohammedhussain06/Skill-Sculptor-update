import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        const options = {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        };

        await mongoose.connect(process.env.MONGO_URI, options);
        const conn = mongoose.connection;
        console.log(
            `✅ MongoDB connected: db=${conn.name} host=${conn.host || 'Atlas'}`
        );
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        console.error("Full error:", error);
        process.exit(1);
    }
};

export default connectDB;
