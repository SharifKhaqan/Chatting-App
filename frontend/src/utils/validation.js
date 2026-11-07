// ===============================
// Login Validation
// ===============================
export const validateLogin = ({ email, password }) => {
  const errors = {};

  // Email Validation
  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  // Password Validation
  if (!password.trim()) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
};

// ===============================
// Register Validation
// ===============================
export const validateRegister = ({
  fullName,
  email,
  password,
  confirmPassword,
}) => {
  const errors = {};

  // Full Name Validation
  if (!fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (fullName.trim().length < 3) {
    errors.fullName = "Full name must be at least 3 characters.";
  }

  // Email Validation
  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  // Password Validation
  if (!password.trim()) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  // Confirm Password Validation
  if (!confirmPassword.trim()) {
    errors.confirmPassword = "Confirm password is required.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
};