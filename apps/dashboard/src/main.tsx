import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "@packages/localization";
import i18n from "@packages/localization";
import "@packages/ui/globals.css";

const router = getRouter();

function App() {
   useEffect(() => {
      document.documentElement.lang = i18n.language;
   }, [i18n.language]);
   return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
   <React.StrictMode>
      <App />
   </React.StrictMode>,
);
