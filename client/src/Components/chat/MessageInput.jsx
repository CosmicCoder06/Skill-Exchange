import { useState } from "react";
import "./ChatPremium.css";


const MAX_MESSAGE_LENGTH =
    256;


export default function MessageInput({

    disabled,
    onSend,
    onTyping

}) {

    const [
        content,
        setContent
    ] = useState("");


    async function handleSubmit(
        event
    ) {

        event.preventDefault();


        const cleanContent =
            content.trim();


        if (
            !cleanContent ||
            disabled
        ) {
            return;
        }


        setContent("");

        onTyping(false);


        const sent =
            await onSend(
                cleanContent
            );


        if (!sent) {

            setContent(
                cleanContent
            );

            onTyping(
                true
            );

        }

    }


    function handleChange(
        event
    ) {

        const value =
            event.target.value;


        setContent(
            value
        );


        onTyping(
            Boolean(
                value.trim()
            )
        );

    }


    return (

        <form
            className="message-input"
            onSubmit={
                handleSubmit
            }
        >

            <label
                className="sr-only"
                htmlFor="chat-message"
            >
                Message
            </label>


            <textarea
                id="chat-message"
                value={
                    content
                }
                onChange={
                    handleChange
                }
                placeholder="Write a message..."
                maxLength={
                    MAX_MESSAGE_LENGTH
                }
                rows={1}
                disabled={
                    disabled
                }
                onKeyDown={(
                    event
                ) => {

                    if (
                        event.key ===
                            "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();

                        event.currentTarget
                            .form
                            .requestSubmit();

                    }

                }}
            />


            <button
                type="submit"
                className="message-send-btn"
                disabled={
                    disabled ||
                    !content.trim()
                }
                aria-label="Send message"
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                </svg>
            </button>

        </form>

    );

}
// @teamcosmiccoders
