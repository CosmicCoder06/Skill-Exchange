import { useRef, useState } from "react"

function formatMessageTime(date) {
    if (!date) return ""

    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(date))
}

export default function MessageBubble({
    message,
    isOwn,
    onEdit,
    onDelete,
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(message.content || "")
    const menuRef = useRef(null)

    function handleDocumentClick(event) {
        if (!menuRef.current?.contains(event.target)) {
            setMenuOpen(false)
        }
    }

    function startMenuListener() {
        document.addEventListener("mousedown", handleDocumentClick)
    }

    function removeMenuListener() {
        document.removeEventListener(
            "mousedown",
            handleDocumentClick
        )
    }

    const canDeleteForEveryone =
        isOwn &&
        !message.deleted &&
        Array.isArray(message.readBy) &&
        !message.readBy.some(
            (id) =>
                String(id) !==
                String(message.sender?._id || message.sender)
        )

    async function saveEdit() {
        const clean = draft.trim()

        if (!clean || clean === message.content) {
            setEditing(false)
            setMenuOpen(false)
            return
        }

        const success = await onEdit(message._id, clean)

        if (success) {
            setEditing(false)
            setMenuOpen(false)
        }
    }

    if (message.deleted) {
        return (
            <article
                className={`message-row ${isOwn ? "is-own" : ""}`}
            >
                <div className="message-bubble deleted-message">
                    <p>🚫 This message was deleted</p>

                    <time className="message-time">
                        {formatMessageTime(
                            message.deletedAt ||
                                message.updatedAt
                        )}
                    </time>
                </div>
            </article>
        )
    }

    return (
        <article
            className={`message-row ${isOwn ? "is-own" : ""}`}
        >
            <div className="message-bubble">
                {editing ? (
                    <div className="message-edit-box">
                        <textarea
                            value={draft}
                            onChange={(event) =>
                                setDraft(event.target.value)
                            }
                            autoFocus
                            maxLength={2000}
                            rows={3}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter" &&
                                    !event.shiftKey
                                ) {
                                    event.preventDefault()
                                    saveEdit()
                                }

                                if (event.key === "Escape") {
                                    setEditing(false)
                                }
                            }}
                        />

                        <div className="message-edit-actions">
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="primary-small"
                                onClick={saveEdit}
                            >
                                Update
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <button
                            type="button"
                            className="message-menu-trigger"
                            aria-label="Message options"
                            onClick={() => {
                                setMenuOpen((value) => !value)

                                if (!menuOpen) {
                                    startMenuListener()
                                } else {
                                    removeMenuListener()
                                }
                            }}
                        >
                            ⋮
                        </button>

                        {menuOpen ? (
                            <div
                                className="message-context-menu"
                                ref={menuRef}
                            >
                                {isOwn ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditing(true)
                                            setMenuOpen(false)
                                            removeMenuListener()
                                        }}
                                    >
                                        ✎ Edit
                                    </button>
                                ) : null}

                                {canDeleteForEveryone ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            removeMenuListener()
                                            onDelete(
                                                message._id,
                                                "everyone"
                                            )
                                        }}
                                    >
                                        🗑 Delete for everyone
                                    </button>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        removeMenuListener()
                                        onDelete(
                                            message._id,
                                            "me"
                                        )
                                    }}
                                >
                                    🗑 Delete for me
                                </button>
                            </div>
                        ) : null}

                        <p>{message.content}</p>

                        <time
                            dateTime={message.createdAt}
                            className="message-time"
                        >
                            {formatMessageTime(
                                message.createdAt
                            )}
                            {message.edited
                                ? " · edited"
                                : ""}
                        </time>
                    </>
                )}
            </div>
        </article>
    )
}
// @teamcosmiccoders
