import { createRouter, RouterProvider } from "@tanstack/react-router";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "@packages/localization";
import i18n from "@packages/localization";
import "@packages/ui/globals.css";

const router = createRouter({
   defaultPendingMs: 0,
   defaultPreload: "intent",
   defaultPreloadDelay: 0,
   defaultPreloadStaleTime: 0,
   routeTree,
   scrollRestoration: true,
});

declare module "@tanstack/react-router" {
   interface Register {
      router: typeof router;
   }
}

function App() {
   useEffect(() => {
      document.documentElement.lang = i18n.language;
   }, []);
   return <RouterProvider router={router} />;
}

// biome-ignore lint/style/noNonNullAssertion: <comes like this>
const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
   const root = ReactDOM.createRoot(rootElement);
   root.render(
      <React.StrictMode>
         <App />
      </React.StrictMode>,
   );
}
