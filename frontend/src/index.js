import React from "react";
import ReactDOM from "react-dom/client";
import { registerLicense } from "@syncfusion/ej2-base";
import "@/index.css";
import App from "@/App";

registerLicense("NxYtGyMROh0gHDMgDk1jX09FaFtGVmZWfFtpR2NbeU53flVDal5WVAciSV9jS3hTckdrWXhccnRUQmdUU091XA==");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
