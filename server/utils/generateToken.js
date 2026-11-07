import jwt from "jsonwebtoken";

// Generate JWT and store it in a cookie
const generateToken = (userId, res) => {
  // Create JWT
  const token = jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  // Store JWT in HTTP-only cookie
  res.cookie("token", token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

// In production the frontend and backend are on different domains,
// so the cookie must be sameSite "none" (which requires secure/HTTPS)
const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "strict",
};

export default generateToken;