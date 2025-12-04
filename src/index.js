import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PathduxProvider } from "pathdux";

import App from "./App/App.js";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

const initialState = {

};

root.render(
  <StrictMode>
    <PathduxProvider initialState={initialState}>
      <App />
    </PathduxProvider>
  </StrictMode>
);
