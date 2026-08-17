function formatMessageTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

export default function MessageBubble({ message, isOwn }) {
  return (
    <article className={`message-row${isOwn ? " is-own" : ""}`}>
      <div className="message-bubble">
        <p>{message.content}</p>
        <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
      </div>
    </article>
  )
}

