import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PathduxProvider } from "pathdux";

import App from "./App/App.js";
import {initialState,initialActions} from "./Store/Store.js";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);


root.render(
  <StrictMode>
    <PathduxProvider initialState={initialState} initialActions={initialActions}>
      <App />
    </PathduxProvider>
  </StrictMode>
);
