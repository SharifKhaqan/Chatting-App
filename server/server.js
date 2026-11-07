import "dotenv/config"; 
import { app, server, allowedOrigins } from "./socket/socket.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js"; 
import authRoute from "./routes/authRoutes.js";
import messageRoute from "./routes/messageRoutes.js";
import groupRoute from "./routes/groupRoutes.js";


connectDB();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Parse incoming JSON data
app.use(express.json({ limit: "10mb" }));

app.use(cookieParser());


app.use("/api/auth", authRoute);
app.use("/api/messages", messageRoute);
app.use("/api/groups", groupRoute);



app.get("/", (req, res) => {
    res.send("Server is Running");
});

const PORT = process.env.PORT || 5000; 

// Start the server
server.listen(PORT, () => {
    console.log(`Server is Running on Port ${PORT}`);
});