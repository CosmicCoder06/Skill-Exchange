import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from "./context/ThemeContext.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Analytics />
      <SpeedInsights />
    </ThemeProvider>
  </StrictMode>,
)
// @teamcosmiccoders

import './premium.css';
import './editorial.css';
import './chat-restored.css';
import './session-receipts.css';
import './Pages/Learner Dashboard/LearnerDashboard.css';
import './Pages/Mentor Dashboard/MentorDashboard.css';
