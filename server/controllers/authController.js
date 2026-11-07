import User from "../models/User.js";
import bcrypt from "bcrypt"; 
import generateToken from "../utils/generateToken.js"; 
import cloudinary from "../config/cloudinary.js";

//Register User Controller
export const registerUser = async (req, res) => {
  try {
    // Get user data from request body
    const { name, email, password, profilePic } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePicUrl = "";

    // If a profile picture was selected (base64 string), upload it to Cloudinary
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "Chat-App/profile-pics",
      });
      profilePicUrl = uploadResponse.secure_url;
    }

    // Create a new user in the database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profilePic: profilePicUrl,
    });

   // Generate JWT and store it in a cookie
   generateToken(user._id, res);

    // Trigger n8n onboarding webhook (non-blocking)
    if (process.env.N8N_ONBOARDING_WEBHOOK_URL) {
      fetch(process.env.N8N_ONBOARDING_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          name: user.name,
          email: user.email,
          profilePic: user.profilePic,
          createdAt: user.createdAt,
        }),
      }).catch((err) => {
        console.error("n8n onboarding webhook error:", err.message);
      });
    }

    // Send success response
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    });

  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// Login User Controller
export const loginUser = async (req, res) => {
  try {
    // Get email and password from request body
    const { email, password } = req.body;

    // Check if all fields are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // Compare entered password with hashed password
    const isPasswordMatched = await bcrypt.compare(
      password,
      user.password
    );// Check if password is correct
    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // Generate JWT and store it in cookie
    generateToken(user._id, res);

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    });

  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Logout User Controller
export const logoutUser = async (req, res) => {
  try {

    // Clear the token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Logout Successful",
    });

  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });}
};


// Check Authentication Controller
export const checkAuth = async (req, res) => {
  try {

    // Send logged-in user data
    return res.status(200).json({
      success: true,
      user: req.user,
    });

  } catch (error) {

    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });

  }
};

// Update Profile Controller (name, about, profile picture)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, about, profilePic } = req.body;

    const updateData = {};

    if (name !== undefined && name.trim() !== "") {
      updateData.name = name.trim();
    }

    if (about !== undefined) {
      updateData.about = about.trim();
    }

    // If a new profile picture (base64 string) was sent, upload it to Cloudinary
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "Chat-App/profile-pics",
      });
      updateData.profilePic = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Change Password Controller
export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(userId);

    // Verify the current password before allowing a change
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};