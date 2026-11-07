import { createSlice } from "@reduxjs/toolkit";

// Initial State
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

// Create Auth Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },

    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

// Export Actions
export const { setUser, logoutUser, setLoading } = authSlice.actions;

// Export Reducer
export default authSlice.reducer;