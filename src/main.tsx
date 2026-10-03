import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const initialTheme = localStorage.getItem("snapcut-theme") === "dark" ? "dark" : "light";
document.documentElement.classList.toggle("dark", initialTheme === "dark");

createRoot(document.getElementById("root")!).render(<App />);
