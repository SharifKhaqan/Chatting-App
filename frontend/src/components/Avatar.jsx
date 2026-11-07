import React from "react";

// Shows the user's profile picture if they have one,
// otherwise shows a colored circle with the first letter of their name.
const Avatar = ({ src, name, sizeClass = "w-12 h-12", textSizeClass = "text-lg" }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border`}
      />
    );
  }

  const firstLetter = name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      className={`${sizeClass} rounded-full bg-indigo-600 flex items-center justify-center border`}
    >
      <span className={`${textSizeClass} font-semibold text-white`}>
        {firstLetter}
      </span>
    </div>
  );
};

export default Avatar;