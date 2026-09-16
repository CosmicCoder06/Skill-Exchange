import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AIMatchModal } from './Components/AIMatchModal';
import { loadLiveMentors } from './services/liveMentors.js';

export function AIExtension({ token, onSelectMentor, onRequireLogin }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="header-ai-matcher" onClick={() => {
      if (!token) { onRequireLogin?.(); return; }
      setOpen(true);
    }}><span aria-hidden="true">✦</span> AI Matcher</button>
    {open && createPortal(<AIMatchModal isOpen onClose={() => setOpen(false)} loadMentors={() => loadLiveMentors(import.meta.env.VITE_API_URL, token)} onSelectMentor={mentor => { setOpen(false); onSelectMentor(mentor); }} />, document.body)}
  </>;
}
