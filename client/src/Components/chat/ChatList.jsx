function getOtherParticipant(conversation, currentUserId) {
  return conversation.participants.find(
    (participant) => participant._id !== currentUserId,
  )
}

function formatActivity(date) {
  if (!date) return ""
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

export default function ChatList({ conversations, currentUserId, selectedId, onSelect }) {
  if (conversations.length === 0) {
    return <p className="chat-empty-list">No conversations yet.</p>
  }

  return (
    <ul className="chat-list" aria-label="Conversations">
      {conversations.map((conversation) => {
        const contact = getOtherParticipant(conversation, currentUserId)
        const selected = conversation._id === selectedId
        return (
          <li key={conversation._id}>
            <button
              type="button"
              className={`chat-list-item${selected ? " is-selected" : ""}`}
              onClick={() => onSelect(conversation._id)}
              aria-pressed={selected}
            >
              <span className="chat-avatar" aria-hidden="true">
                {(contact?.name || "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="chat-list-copy">
                <span className="chat-list-heading">
                  <strong>{contact?.name || "Unknown user"}</strong>
                  <time dateTime={conversation.lastActivityAt}>
                    {formatActivity(conversation.lastActivityAt)}
                  </time>
                </span>
                <span className="chat-preview">
                  {conversation.lastMessage?.content || "Start the conversation"}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

