import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import AuthChecker from "./utils/AuthChecker.jsx";
import "./index.css";
import App from "./App.jsx";
import store from "./redux/store";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
  <BrowserRouter>
    <Toaster
      position="top-right"
      reverseOrder={false}
    />

    <AuthChecker>
      <App />
    </AuthChecker>
  </BrowserRouter>
  
</Provider>
);