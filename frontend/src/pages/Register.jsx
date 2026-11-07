import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import { validateRegister } from "../utils/validation";
import { registerUser } from "../api/authApi";
import toast from "react-hot-toast";
import { Camera } from "lucide-react";

// Convert a selected file to base64, same pattern used elsewhere in the app
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const Register = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Profile picture state
  const [profilePic, setProfilePic] = useState(null); // raw File object
  const [profilePicPreview, setProfilePicPreview] = useState(null); // for display

  // Validation Errors
  const [errors, setErrors] = useState({});

  // Loading State
  const [loading, setLoading] = useState(false);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Remove error while typing
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // Handle profile picture selection
  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend Validation
    const validationErrors = validateRegister(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);

      // Convert profile picture to base64 if one was selected
      let base64Pic = "";
      if (profilePic) {
        base64Pic = await fileToBase64(profilePic);
      }

      // Send data to backend
      const response = await registerUser({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        profilePic: base64Pic,
      });

      toast.success(response.data.message || "Registration successful!");

      // Clear form
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setProfilePic(null);
      setProfilePicPreview(null);

      //Navigate to login 
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the chat community and start messaging."
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Profile Picture */}
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={profilePicPreview || "https://placehold.co/100x100?text=User"}
              alt="Profile Preview"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
            />
            <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer shadow-md transition">
              <Camera size={16} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePicChange}
              />
            </label>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${
              errors.fullName
                ? "border-red-500 focus:ring-2 focus:ring-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-indigo-500"
            }`}
          />

          {errors.fullName && (
            <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Email Address
          </label>

          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${
              errors.email
                ? "border-red-500 focus:ring-2 focus:ring-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-indigo-500"
            }`}
          />

          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Password
          </label>

          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${
              errors.password
                ? "border-red-500 focus:ring-2 focus:ring-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-indigo-500"
            }`}
          />

          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Confirm Password
          </label>

          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${
              errors.confirmPassword
                ? "border-red-500 focus:ring-2 focus:ring-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-indigo-500"
            }`}
          />

          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Register Button */}
        <Button type="submit" loading={loading}>
          Create Account
        </Button>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;