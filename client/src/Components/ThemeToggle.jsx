import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import "./ThemeToggle.css";

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            type="button"
            className={`theme-toggle ${isDark ? "is-dark" : "is-light"}`}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            <span className="theme-toggle-icon">
                {isDark ? (
                    <Sun size={18} strokeWidth={2.2} className="sun-icon" />
                ) : (
                    <Moon size={18} strokeWidth={2.2} className="moon-icon" />
                )}
            </span>
        </button>
    );
}

export default ThemeToggle;
// @teamcosmiccoders
