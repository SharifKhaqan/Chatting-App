import React from "react";

const Button = ({
  type = "button",
  children,
  onClick,
  disabled = false,
  loading = false,
  className = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        w-full
        bg-indigo-600
        hover:bg-indigo-700
        text-white
        font-semibold
        py-3
        rounded-lg
        transition-all
        duration-300
        disabled:bg-gray-400
        disabled:cursor-not-allowed
        ${className}
      `}
    >
       {loading ? "Loading..." : children}
    </button>
  );
};

export default Button;