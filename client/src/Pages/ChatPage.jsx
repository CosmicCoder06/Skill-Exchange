import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"

import ChatList from "../Components/chat/ChatList"
import MessageBubble from "../Components/chat/MessageBubble"
import MessageInput from "../Components/chat/MessageInput"
import useSocket from "../context/useSocket"
import {
    createConversation,
    deleteConversation,
    deleteMessage,
    editMessage,
    fetchConversations,
    fetchMessages,
    fetchUsers,
    markConversationRead,
    sendMessage,
} from "../services/chatService"

import "./ChatPage.css"

function getUserId(token) {
    try {
        if (!token) return null

        const payload = token
            .split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/")

        return JSON.parse(atob(payload)).id
    } catch {
        return null
    }
}

function getOtherParticipant(conversation, currentUserId) {
    return conversation?.participants?.find(
        (participant) =>
            String(participant._id) !== String(currentUserId)
    )
}

function addUnique(messages, incoming) {
    const exists = messages.some(
        (message) => String(message._id) === String(incoming._id)
    )

    return exists
        ? messages.map((message) =>
              String(message._id) === String(incoming._id)
                  ? { ...message, ...incoming }
                  : message
          )
        : [...messages, incoming]
}

export default function ChatPage({
    token,
    onLogout,
    onHome,
    onProfile,
    onViewProfile,
    initialUserId,
}) {
    const currentUserId = useMemo(
        () => getUserId(token),
        [token]
    )

    const { socket, connected } = useSocket()

    const [conversations, setConversations] = useState([])
    const [selectedId, setSelectedId] = useState(null)
    const [messages, setMessages] = useState([])
    const [users, setUsers] = useState([])
    const [search, setSearch] = useState("")
    const [messageSearch, setMessageSearch] = useState("")
    const [showMessageSearch, setShowMessageSearch] = useState(false)
    const [filter, setFilter] = useState("all")
    const [showNewChat, setShowNewChat] = useState(false)
    const [loading, setLoading] = useState(true)
    const [usersLoading, setUsersLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState("")
    const [typingUserId, setTypingUserId] = useState(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const [creatingChat, setCreatingChat] = useState(false)

    const typingTimer = useRef(null)
    const messagesEnd = useRef(null)
    const initialHandled = useRef(false)

    const selectedConversation = conversations.find(
        (conversation) =>
            String(conversation._id) === String(selectedId)
    )

    const contact = getOtherParticipant(
        selectedConversation,
        currentUserId
    )

    const isBookedChat = Boolean(selectedConversation?.bookingId)

    const directMessageCount = messages.length
    const directLimitReached =
        !isBookedChat && directMessageCount >= 5

    const refreshConversations = useCallback(async () => {
        const result = await fetchConversations()
        setConversations(result)
        return result
    }, [])

    useEffect(() => {
        let active = true

        fetchConversations()
            .then((result) => {
                if (!active) return
                setConversations(result)
            })
            .catch((requestError) => {
                if (active) {
                    setError(
                        requestError?.response?.data?.message ||
                            "Could not load conversations"
                    )
                }
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        if (
            !initialUserId ||
            initialHandled.current ||
            loading
        ) {
            return
        }

        const existing = conversations.find((conversation) =>
            conversation.participants?.some(
                (participant) =>
                    String(participant._id) ===
                    String(initialUserId)
            )
        )

        if (existing) {
    initialHandled.current = true

    queueMicrotask(() => {
        setSelectedId(existing._id)
    })

    return
}

        async function createInitialChat() {
            try {
                initialHandled.current = true
                const conversation =
                    await createConversation(initialUserId)

                setConversations((current) => [
                    conversation,
                    ...current.filter(
                        (item) =>
                            String(item._id) !==
                            String(conversation._id)
                    ),
                ])
                setSelectedId(conversation._id)
            } catch (requestError) {
                setError(
                    requestError?.response?.data?.message ||
                        "Could not open chat"
                )
            }
        }

        createInitialChat()
    }, [initialUserId, loading, conversations])

  useEffect(() => {
    if (!selectedId) {
        return
    }

    let active = true

    fetchMessages(selectedId)
            .then((result) => {
                if (active) setMessages(result)
            })
            .catch((requestError) => {
                if (active) {
                    setError(
                        requestError?.response?.data?.message ||
                            "Could not load messages"
                    )
                }
            })

        markConversationRead(selectedId)
            .then(() => refreshConversations())
            .catch(() => {})

        return () => {
            active = false
        }
    }, [selectedId, refreshConversations])

    useEffect(() => {
        if (!selectedId || !socket) return undefined

        const handleReceive = (message) => {
            if (
                String(message.conversation) !==
                String(selectedId)
            ) {
                return
            }

            setMessages((current) =>
                addUnique(current, message)
            )

            markConversationRead(selectedId).catch(() => {})
            refreshConversations().catch(() => {})
        }

        const handleUpdated = (message) => {
            if (
                String(message.conversation) !==
                String(selectedId)
            ) {
                return
            }

            setMessages((current) =>
                current.map((item) =>
                    String(item._id) === String(message._id)
                        ? message
                        : item
                )
            )
        }

        const handleDeleted = (message) => {
            if (
                String(message.conversation) !==
                String(selectedId)
            ) {
                return
            }

            setMessages((current) =>
                current
                    .map((item) =>
                        String(item._id) === String(message._id)
                            ? message
                            : item
                    )
                    .filter(
                        (item) =>
                            !item.deletedFor?.some(
                                (id) =>
                                    String(id) ===
                                    String(currentUserId)
                            )
                    )
            )

            refreshConversations().catch(() => {})
        }

        const handleRead = ({ conversationId, userId }) => {
            if (
                String(conversationId) !==
                String(selectedId)
            ) {
                return
            }

            setMessages((current) =>
                current.map((message) => ({
                    ...message,
                    readBy: Array.from(
                        new Set([
                            ...(message.readBy || []).map(String),
                            String(userId),
                        ])
                    ),
                }))
            )
        }

        const handleTypingStart = ({
            conversationId,
            userId,
        }) => {
            if (
                String(conversationId) ===
                String(selectedId)
            ) {
                setTypingUserId(userId)
            }
        }

        const handleTypingStop = ({ conversationId }) => {
            if (
                String(conversationId) ===
                String(selectedId)
            ) {
                setTypingUserId(null)
            }
        }

        const handleError = ({ message }) => {
            setError(message || "Chat error")
        }

        socket.emit("join_conversation", {
            conversationId: selectedId,
        })

        socket.on("receive_message", handleReceive)
        socket.on("message_updated", handleUpdated)
        socket.on("message_deleted", handleDeleted)
        socket.on("messages_read", handleRead)
        socket.on("typing_start", handleTypingStart)
        socket.on("typing_stop", handleTypingStop)
        socket.on("chat_error", handleError)

        return () => {
            socket.emit("leave_conversation", {
                conversationId: selectedId,
            })

            socket.off("receive_message", handleReceive)
            socket.off("message_updated", handleUpdated)
            socket.off("message_deleted", handleDeleted)
            socket.off("messages_read", handleRead)
            socket.off("typing_start", handleTypingStart)
            socket.off("typing_stop", handleTypingStop)
            socket.off("chat_error", handleError)
            setTypingUserId(null)
        }
    }, [
        currentUserId,
        refreshConversations,
        selectedId,
        socket,
    ])

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({
            behavior: "smooth",
        })
    }, [messages, typingUserId])

    useEffect(
        () => () => clearTimeout(typingTimer.current),
        []
    )

    async function openNewChat() {
        setShowNewChat(true)
        setMenuOpen(false)
        setError("")
        setUsersLoading(true)

        try {
            const result = await fetchUsers()
            setUsers(
                result.filter(
                    (user) =>
                        String(user._id) !==
                        String(currentUserId) &&
                        user.role !== "admin"
                )
            )
        } catch (requestError) {
            setError(
                requestError?.response?.data?.message ||
                    requestError.message ||
                    "Unable to load users"
            )
        } finally {
            setUsersLoading(false)
        }
    }

    async function handleCreateChat(user) {
        try {
            setCreatingChat(true)
            const conversation =
                await createConversation(user._id)

            setConversations((current) => [
                conversation,
                ...current.filter(
                    (item) =>
                        String(item._id) !==
                        String(conversation._id)
                ),
            ])

            setSelectedId(conversation._id)
            setMessages([])
            setShowNewChat(false)
        } catch (requestError) {
            setError(
                requestError?.response?.data?.message ||
                    "Could not create conversation"
            )
        } finally {
            setCreatingChat(false)
        }
    }

    async function handleSend(content) {
        if (!selectedId || directLimitReached) return false

        try {
            setSending(true)
            setError("")

            if (socket?.connected) {
                const result = await new Promise(
                    (resolve) => {
                        socket
                            .timeout(7000)
                            .emit(
                                "send_message",
                                {
                                    conversationId:
                                        selectedId,
                                    content,
                                },
                                (timeoutError, response) => {
                                    if (
                                        timeoutError ||
                                        !response?.ok
                                    ) {
                                        resolve({
                                            ok: false,
                                            message:
                                                response?.message ||
                                                "Message could not be sent",
                                        })
                                        return
                                    }

                                    resolve(response)
                                }
                            )
                    }
                )

                if (!result.ok) {
                    setError(result.message)
                    return false
                }

                return true
            }

            await sendMessage(selectedId, content)
            const refreshed =
                await fetchMessages(selectedId)
            setMessages(refreshed)
            await refreshConversations()
            return true
        } catch (requestError) {
            setError(
                requestError?.response?.data?.message ||
                    "Message could not be sent"
            )
            return false
        } finally {
            setSending(false)
        }
    }

    function handleTyping(isTyping) {
        if (!socket || !selectedId) return

        clearTimeout(typingTimer.current)

        socket.emit(
            isTyping ? "typing_start" : "typing_stop",
            { conversationId: selectedId }
        )

        if (isTyping) {
            typingTimer.current = setTimeout(() => {
                socket.emit("typing_stop", {
                    conversationId: selectedId,
                })
            }, 1000)
        }
    }

    async function handleEdit(messageId, content) {
        try {
            const updated =
                await editMessage(messageId, content)

            setMessages((current) =>
                current.map((message) =>
                    String(message._id) ===
                    String(messageId)
                        ? updated
                        : message
                )
            )

            return true
        } catch (requestError) {
            setError(
                requestError?.response?.data?.message ||
                    "Unable to edit message"
            )
            return false
        }
    }

    async function handleDeleteMessage(
        messageId,
        mode
    ) {
        try {
            const result =
                await deleteMessage(messageId, mode)

            if (mode === "me") {
                setMessages((current) =>
                    current.filter(
                        (message) =>
                            String(message._id) !==
                            String(messageId)
                    )
                )
            } else if (result.message) {
                setMessages((current) =>
                    current.map((message) =>
                        String(message._id) ===
                        String(messageId)
                            ? result.message
                            : message
                    )
                )
            }

            await refreshConversations()
        } catch (requestError) {
            setError(
                requestError?.response?.data?.message ||
                    "Unable to delete message"
            )
        }
    }

    async function handleDeleteChat(conversation) {
        const name =
            getOtherParticipant(
                conversation,
                currentUserId
            )?.name || "this chat"

        const confirmed = window.confirm(
            `Delete ${name} from your chat list?`
        )

        if (!confirmed) return

        try {
            await deleteConversation(conversation._id)

            setConversations((current) =>
                current.filter(
                    (item) =>
                        String(item._id) !==
                        String(conversation._id)
                )
            )

            if (
                String(selectedId) ===
                String(conversation._id)
            ) {
                setSelectedId(null)
                setMessages([])
            }
        } catch (requestError) {
            setError(
                requestError?.response?.data?.message ||
                    "Unable to delete chat"
            )
        }
    }

    function selectConversation(id) {
        setSelectedId(id)
        setShowNewChat(false)
        setMenuOpen(false)
        setMessageSearch("")
        setShowMessageSearch(false)
        setError("")
    }

    const visibleConversations = conversations.filter(
        (conversation) => {
            const contact =
                getOtherParticipant(
                    conversation,
                    currentUserId
                )

            const name =
                contact?.name?.toLowerCase() || ""

            const preview =
                conversation.lastMessage?.content
                    ?.toLowerCase() || ""

            const matchesSearch =
                !search.trim() ||
                name.includes(search.toLowerCase()) ||
                preview.includes(search.toLowerCase())

            const unread = Boolean(
                conversation.__unread
            )

            return (
                matchesSearch &&
                (filter === "all" || unread)
            )
        }
    )

    const visibleMessages = messages.filter(
        (message) =>
            !messageSearch.trim() ||
            message.content
                ?.toLowerCase()
                .includes(messageSearch.toLowerCase())
    )

    return (
        <main className="chat-page">
            <aside className="chat-nav" aria-label="Main navigation">
                <button
                    type="button"
                    className="chat-brand-mark"
                    onClick={onHome}
                    aria-label="Skill Exchange home"
                >
                    SE
                </button>

                <nav className="chat-nav-links">
                    <button
                        type="button"
                        onClick={onHome}
                        title="Home"
                    >
                        <span>⌂</span>
                        <small>Home</small>
                    </button>

                    <button
                        type="button"
                        className="is-active"
                        title="Messages"
                    >
                        <span>◇</span>
                        <small>Chats</small>
                    </button>

                    <button
                        type="button"
                        onClick={onProfile}
                        title="Profile"
                    >
                        <span>◎</span>
                        <small>Profile</small>
                    </button>
                </nav>

                <button
                    type="button"
                    className="chat-nav-logout"
                    onClick={onLogout}
                    title="Log out"
                >
                    <span>↪</span>
                    <small>Logout</small>
                </button>
            </aside>

            <section className="chat-main">
                <header className="chat-topbar">
                    <div>
                        <span className="eyebrow">
                            Skill Exchange
                        </span>
                        <h1>Messages</h1>
                    </div>

                    <div className="chat-topbar-right">
                        <span
                            className={`connection-status ${
                                connected ? "is-online" : ""
                            }`}
                        >
                            {connected
                                ? "Live"
                                : "Reconnecting"}
                        </span>

                    </div>
                </header>

                {error ? (
                    <div className="chat-alert">
                        {error}
                        <button
                            type="button"
                            onClick={() => setError("")}
                        >
                            ×
                        </button>
                    </div>
                ) : null}

                <section className="chat-workspace">
                    <aside className="chat-sidebar">
                        <div className="sidebar-title-row">
                            <div>
                                <h2>Chats</h2>
                                <span>
                                    {conversations.length}
                                </span>
                            </div>

                            <button
                                type="button"
                                className="new-chat-icon"
                                onClick={openNewChat}
                                title="New chat"
                            >
                                +
                            </button>
                        </div>

                        <label className="chat-search">
                            <span>⌕</span>
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search or start a new chat"
                            />
                        </label>

                        <div className="chat-filters">
                            <button
                                type="button"
                                className={
                                    filter === "all"
                                        ? "is-active"
                                        : ""
                                }
                                onClick={() =>
                                    setFilter("all")
                                }
                            >
                                All
                            </button>

                            <button
                                type="button"
                                className={
                                    filter === "unread"
                                        ? "is-active"
                                        : ""
                                }
                                onClick={() =>
                                    setFilter("unread")
                                }
                            >
                                Unread
                                <span className="filter-count">
                                    {
                                        conversations.filter(
                                            (item) =>
                                                item.__unread
                                        ).length
                                    }
                                </span>
                            </button>
                        </div>

                        {loading ? (
                            <p className="chat-empty-list">
                                Loading chats...
                            </p>
                        ) : (
                            <ChatList
                                conversations={
                                    visibleConversations
                                }
                                currentUserId={
                                    currentUserId
                                }
                                selectedId={selectedId}
                                onSelect={
                                    selectConversation
                                }
                                onDelete={
                                    handleDeleteChat
                                }
                            />
                        )}
                    </aside>

                    <section className="chat-thread">
                        {showNewChat ? (
                            <div className="new-chat-panel">
                                <div>
                                    <span className="new-chat-eyebrow">
                                        Start a conversation
                                    </span>
                                    <h2>
                                        Who do you want to
                                        chat with?
                                    </h2>
                                    <p>
                                        Choose a mentor or
                                        learner to start a
                                        direct conversation.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="close-link"
                                    onClick={() =>
                                        setShowNewChat(false)
                                    }
                                >
                                    Close
                                </button>

                                {usersLoading ? (
                                    <p>
                                        Loading users...
                                    </p>
                                ) : (
                                    <div className="new-chat-users">
                                        {users.map((user) => (
                                            <button
                                                type="button"
                                                className="new-chat-user"
                                                key={user._id}
                                                disabled={
                                                    creatingChat
                                                }
                                                onClick={() =>
                                                    handleCreateChat(
                                                        user
                                                    )
                                                }
                                            >
                                                <span className="new-chat-avatar">
                                                    {user.avatarUrl ? (
                                                        <img
                                                            src={
                                                                user.avatarUrl
                                                            }
                                                            alt=""
                                                        />
                                                    ) : (
                                                        user.name
                                                            ?.charAt(
                                                                0
                                                            )
                                                            .toUpperCase()
                                                    )}
                                                </span>

                                                <span>
                                                    <strong>
                                                        {
                                                            user.name
                                                        }
                                                    </strong>
                                                    <small>
                                                        {
                                                            user.role
                                                        }
                                                    </small>
                                                </span>

                                                <span>
                                                    →
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : selectedConversation ? (
                            <>
                                <header className="thread-header">
                                    {showMessageSearch ? (
                                        <div className="thread-inline-search">
                                            <span
                                                className="thread-inline-search-icon"
                                                aria-hidden="true"
                                            >
                                                ⌕
                                            </span>

                                            <input
                                                autoFocus
                                                type="text"
                                                value={messageSearch}
                                                onChange={(event) =>
                                                    setMessageSearch(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Search messages"
                                                aria-label="Search messages"
                                            />

                                            <button
                                                type="button"
                                                className="thread-inline-search-close"
                                                onClick={() => {
                                                    setMessageSearch("")
                                                    setShowMessageSearch(false)
                                                }}
                                                aria-label="Close message search"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="thread-contact"
                                            onClick={() => {
                                                if (contact?._id) {
                                                    onViewProfile?.(
                                                        contact._id
                                                    )
                                                }
                                            }}
                                            disabled={!contact?._id}
                                            aria-label={
                                                contact
                                                    ? `Open ${contact.name}'s profile`
                                                    : "Open user profile"
                                            }
                                        >
                                            <span
                                                className="thread-avatar"
                                                aria-hidden="true"
                                            >
                                                {contact?.avatarUrl ? (
                                                    <img
                                                        src={contact.avatarUrl}
                                                        alt=""
                                                    />
                                                ) : (
                                                    contact?.name
                                                        ?.charAt(0)
                                                        .toUpperCase()
                                                )}
                                            </span>

                                            <span className="thread-contact-info">
                                                <strong>
                                                    {contact?.name ||
                                                        "Unknown user"}
                                                </strong>

                                                <span>
                                                    {isBookedChat
                                                        ? "Booked session chat"
                                                        : "Direct skill chat"}
                                                </span>
                                            </span>
                                        </button>
                                    )}

                                    <div className="thread-actions">
                                        {menuOpen ? (
                                            <div className="thread-menu">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowMessageSearch(true)
                                                        setMessageSearch("")
                                                        setMenuOpen(false)
                                                    }}
                                                >
                                                    Search messages
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMenuOpen(false)
                                                    }}
                                                >
                                                    Mark as unread
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteChat(
                                                            selectedConversation
                                                        )
                                                    }
                                                >
                                                    Delete chat
                                                </button>
                                            </div>
                                        ) : null}

                                        <button
                                            type="button"
                                            className="thread-search-button"
                                            onClick={() => {
                                                setShowMessageSearch(
                                                    (current) => !current
                                                )

                                                if (showMessageSearch) {
                                                    setMessageSearch("")
                                                }

                                                setMenuOpen(false)
                                            }}
                                            aria-label="Search messages"
                                            title="Search messages"
                                        >
                                            ⌕
                                        </button>

                                        <button
                                            type="button"
                                            className="thread-menu-button"
                                            onClick={() =>
                                                setMenuOpen(
                                                    (value) => !value
                                                )
                                            }
                                            aria-label="Chat options"
                                            title="Chat options"
                                        >
                                            ⋮
                                        </button>
                                    </div>
                                </header>

                                {!isBookedChat ? (
                                    <div className="direct-limit-banner">
                                        <strong>
                                            Direct chat limit
                                        </strong>

                                        <span>
                                            You can send and receive up to{" "}
                                            <b>5 messages</b> with{" "}
                                            <b>{contact?.name}</b>. Book a
                                            session with{" "}
                                            <b>{contact?.name}</b> to
                                            continue the conversation.
                                        </span>
                                    </div>
                                ) : null}

                                <div className="message-stream">
                                    {visibleMessages.length ===
                                    0 ? (
                                        <div className="empty-thread">
                                            <span>✦</span>
                                            <h3>
                                                Start the
                                                conversation
                                            </h3>
                                            <p>
                                                Ask a question,
                                                share a resource,
                                                or plan your next
                                                session.
                                            </p>
                                        </div>
                                    ) : (
                                        visibleMessages.map(
                                            (message) => (
                                                <MessageBubble
                                                    key={
                                                        message._id
                                                    }
                                                    message={
                                                        message
                                                    }
                                                    isOwn={
                                                        String(
                                                            message
                                                                .sender
                                                                ?._id ||
                                                                message.sender
                                                        ) ===
                                                        String(
                                                            currentUserId
                                                        )
                                                    }
                                                    onEdit={
                                                        handleEdit
                                                    }
                                                    onDelete={
                                                        handleDeleteMessage
                                                    }
                                                />
                                            )
                                        )
                                    )}

                                    {typingUserId ? (
                                        <p className="typing-indicator">
                                            {
                                                contact?.name
                                            }{" "}
                                            is typing...
                                        </p>
                                    ) : null}

                                    <div ref={messagesEnd} />
                                </div>

                                {directLimitReached ? (
                                    <div className="limit-locked">
                                        <span>🔒</span>
                                        <div>
                                            <strong>
                                                You've reached the
                                                5-message limit.
                                            </strong>
                                            <p>
                                                Book a session with{" "}
                                                {
                                                    contact?.name
                                                }{" "}
                                                to continue
                                                chatting.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <MessageInput
                                        disabled={sending}
                                        onSend={
                                            handleSend
                                        }
                                        onTyping={
                                            handleTyping
                                        }
                                    />
                                )}
                            </>
                        ) : (
                            <div className="empty-thread no-selection">
                                <span>✦</span>
                                <h2>
                                    Select a conversation
                                </h2>
                                <p>
                                    Your messages will appear
                                    here. Choose a chat from
                                    the left or start a new one.
                                </p>
                            </div>
                        )}
                    </section>
                </section>
            </section>
        </main>
    )
}
// @teamcosmiccoders
