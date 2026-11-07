import mongoose from "mongoose"; // Import Mongoose


const connectDB = async () => {
    try {
        
        // Connect to MongoDB using the connection string from .env
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        
        console.log("Database Connection Error:", error.message);

        // Stop the server if database connection fails
        process.exit(1);
    }
};

export default connectDB;