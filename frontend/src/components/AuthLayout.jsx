import React from "react";

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        
        {/* Logo / App Name */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600">
            ChatApp
          </h1>
          <p className="text-gray-500 mt-2">
            Connect with your friends instantly
          </p>
        </div>

        {/* Page Title */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {title}
          </h2>

          {subtitle && (
            <p className="text-gray-500 mt-2">
              {subtitle}
            </p>
          )}
        </div>

        {/* Form Content */}
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;