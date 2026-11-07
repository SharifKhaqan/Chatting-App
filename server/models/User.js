import mongoose from "mongoose"; 

// Create User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String, 
      required: true,
      trim: true,
    },

    email: {
      type: String, 
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String, 
      required: true,
    },

    profilePic: {
      type: String, 
      default: "",
    },

    about: {
      type: String,
      default: "Hey there! I am using ChatApp.",
      trim: true,
    },
  },
  {
    timestamps: true, 
  }
);

// Create User Model
const User = mongoose.model("User", userSchema);

// Export User Model
export default User;