import { useState } from "react"

export default function MessageInput({ disabled, onSend, onTyping }) {
  const [content, setContent] = useState("")

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanContent = content.trim()
    if (!cleanContent || disabled) return

    setContent("")
    onTyping(false)
    const sent = await onSend(cleanContent)
    if (!sent) setContent(cleanContent)
  }

  function handleChange(event) {
    const nextContent = event.target.value
    setContent(nextContent)
    onTyping(Boolean(nextContent.trim()))
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="chat-message">
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
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            event.currentTarget.form.requestSubmit()
          }
        }}
      />
      <button type="submit" disabled={disabled || !content.trim()}>
        Send
      </button>
    </form>
  )
}

