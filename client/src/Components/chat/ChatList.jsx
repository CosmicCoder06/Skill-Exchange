function getOtherParticipant(conversation, currentUserId) {
    return conversation.participants?.find(
        (participant) =>
            String(participant._id) !== String(currentUserId)
    );
}

function formatActivity(date) {
    if (!date) return "";

    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit"
    }).format(new Date(date));
}

export default function ChatList({
    conversations,
    currentUserId,
    selectedId,
    onSelect
}) {
    if (!conversations?.length) {
        return (
            <p className="chat-empty-list">
                No conversations yet.
            </p>
        );
    }

    return (
        <ul
            className="chat-list"
            aria-label="Conversations"
        >
            {conversations.map((conversation) => {
                const contact = getOtherParticipant(
                    conversation,
                    currentUserId
                );

                const selected =
                    String(conversation._id) ===
                    String(selectedId);

                const name =
                    contact?.name || "Unknown user";

                const initial =
                    name.slice(0, 1).toUpperCase();

                return (
                    <li
                        key={conversation._id}
                        className="chat-list-entry"
                    >
                        <button
                            type="button"
                            className={`chat-list-item ${
                                selected ? "is-selected" : ""
                            }`}
                            onClick={() =>
                                onSelect(conversation._id)
                            }
                            aria-pressed={selected}
                        >
                            <span
                                className="chat-avatar"
                                aria-hidden="true"
                            >
                                {contact?.avatarUrl ? (
                                    <img
                                        src={contact.avatarUrl}
                                        alt=""
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

                                    <time
                                        dateTime={
                                            conversation.lastActivityAt
                                        }
                                    >
                                        {formatActivity(
                                            conversation.lastActivityAt
                                        )}
                                    </time>
                                </span>

                                <span className="chat-preview">
                                    {conversation.lastMessage
                                        ?.content ||
                                        "Start the conversation"}
                                </span>
                            </span>

                            {selected && (
                                <span
                                    className="chat-active-dot"
                                    aria-hidden="true"
                                />
                            )}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}