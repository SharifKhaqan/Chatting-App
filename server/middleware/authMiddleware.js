import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
  try {

    // Get token from cookies
    const token = req.cookies.token;

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No Token Provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID
    const user = await User.findById(decoded.userId).select("-password");

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User Not Found",
      });
    }

    // Attach user to request object
    req.user = user;

    // Move to next middleware/controller
    next();

  } catch (error) {
    console.log(error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};