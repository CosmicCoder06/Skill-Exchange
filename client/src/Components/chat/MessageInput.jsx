import { useState } from "react";
import "./ChatPremium.css";

export default function MessageInput({
    disabled,
    onSend,
    onTyping
}) {
    const [content, setContent] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();

        const cleanContent = content.trim();

        if (!cleanContent || disabled) {
            return;
        }

        setContent("");
        onTyping(false);

        const sent = await onSend(cleanContent);

        if (!sent) {
            setContent(cleanContent);
            onTyping(true);
        }
    }

    function handleChange(event) {
        const value = event.target.value;

        setContent(value);
        onTyping(Boolean(value.trim()));
    }

    return (
        <form
            className="message-input"
            onSubmit={handleSubmit}
        >
            <label
                className="sr-only"
                htmlFor="chat-message"
            >
                Message
            </label>

            <textarea
                id="chat-message"
                value={content}
                onChange={handleChange}
                placeholder="Write a message..."
                maxLength={2000}
                rows={1}
                disabled={disabled}
                onKeyDown={(event) => {
                    if (
                        event.key === "Enter" &&
                        !event.shiftKey
                    ) {
                        event.preventDefault();
                        event.currentTarget.form.requestSubmit();
                    }
                }}
            />

            <button
                type="submit"
                disabled={
                    disabled ||
                    !content.trim()
                }
                aria-label="Send message"
            >
                <span>↑</span>
            </button>
        </form>
    );
}