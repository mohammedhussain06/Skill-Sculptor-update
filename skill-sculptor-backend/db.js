import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const conn = mongoose.connection;
        console.log(
            `✅ MongoDB connected: db=${conn.name} host=${conn.host} port=${conn.port}`
        );
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;
