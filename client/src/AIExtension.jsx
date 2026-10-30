import { useState } from "react";
import { createPortal } from "react-dom";
import { AIMatchModal } from "./Components/AIMatchModal";

export function AIExtension({ token, onSelectMentor, onRequireLogin, onViewProfile }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="header-ai-matcher"
        onClick={() => {
          if (!token) {
            onRequireLogin?.();
            return;
          }
          setOpen(true);
        }}
      >
        <span aria-hidden="true">✦</span> AI Matcher
      </button>
      {open &&
        createPortal(
          <AIMatchModal
            isOpen
            onClose={() => setOpen(false)}
            token={token}
            onSelectMentor={(mentor) => {
              setOpen(false);
              onSelectMentor(mentor);
            }}
            onViewProfile={
              onViewProfile
                ? (mentorId) => {
                    setOpen(false);
                    onViewProfile(mentorId);
                  }
                : undefined
            }
          />,
          document.body
        )}
    </>
  );
}
