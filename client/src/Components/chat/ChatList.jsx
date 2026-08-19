function getOtherParticipant(conversation, currentUserId) {
    return conversation.participants?.find(
        (participant) =>
            String(participant._id) !== String(currentUserId)
    )
}

function formatActivity(date) {
    if (!date) return ""

    const value = new Date(date)
    const now = new Date()

    if (value.toDateString() === now.toDateString()) {
        return new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "2-digit",
        }).format(value)
    }

    return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "2-digit",
    }).format(value)
}

export default function ChatList({
    conversations,
    currentUserId,
    selectedId,
    onSelect,
    onDelete,
}) {
    if (!conversations?.length) {
        return (
            <p className="chat-empty-list">
                No conversations found.
            </p>
        )
    }

    return (
        <ul className="chat-list" aria-label="Conversations">
            {conversations.map((conversation) => {
                const contact = getOtherParticipant(
                    conversation,
                    currentUserId
                )

                const selected =
                    String(conversation._id) ===
                    String(selectedId)

                const name =
                    contact?.name || "Unknown user"

                const initial =
                    name.charAt(0).toUpperCase()

                return (
                    <li
                        key={conversation._id}
                        className="chat-list-entry"
                    >
                        <div
                            className={`chat-list-item ${
                                selected
                                    ? "is-selected"
                                    : ""
                            } ${
                                conversation.__unread
                                    ? "is-unread"
                                    : ""
                            }`}
                        >
                            <button
                                type="button"
                                className="chat-list-main"
                                onClick={() =>
                                    onSelect(
                                        conversation._id
                                    )
                                }
                            >
                                <span
                                    className="chat-avatar"
                                    aria-hidden="true"
                                >
                                    {contact?.avatarUrl ? (
                                        <img
                                            src={
                                                contact.avatarUrl
                                            }
                                            alt=""
                                            loading="lazy"
                                        />
                                    ) : (
                                        initial
                                    )}
                                </span>

                                <span className="chat-list-copy">
                                    <span className="chat-list-heading">
                                        <strong>
                                            {name}
                                        </strong>

                                        <time>
                                            {formatActivity(
                                                conversation.lastActivityAt
                                            )}
                                        </time>
                                    </span>

                                    <span className="chat-preview">
                                        {conversation
                                            .lastMessage
                                            ?.deleted
                                            ? "This message was deleted"
                                            : conversation
                                                  .lastMessage
                                                  ?.content ||
                                              "Start the conversation"}
                                    </span>
                                </span>

                                {conversation.__unread ? (
                                    <span
                                        className="unread-badge"
                                        aria-label="Unread"
                                    >
                                        •
                                    </span>
                                ) : null}
                            </button>

                            <div className="chat-item-actions">
                                <button
                                    type="button"
                                    className="chat-item-menu-button"
                                    title="Delete chat"
                                    aria-label={`Delete chat with ${name}`}
                                    onClick={() =>
                                        onDelete(
                                            conversation
                                        )
                                    }
                                >
                                    ⋮
                                </button>
                            </div>
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
// @teamcosmiccoders
