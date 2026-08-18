import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import ChatList from "../Components/chat/ChatList";
import MessageBubble from "../Components/chat/MessageBubble";
import MessageInput from "../Components/chat/MessageInput";
import useSocket from "../context/useSocket";

import {
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage as sendMessageWithApi,
} from "../services/chatService";

import "./ChatPage.css";


// =====================================================
// GET CURRENT USER ID FROM JWT
// =====================================================

function getUserId(token) {

    try {

        if (!token) {
            return null;
        }

        const payload = token
            .split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        return JSON.parse(
            atob(payload)
        ).id;

    } catch {

        return null;

    }

}


// =====================================================
// ADD MESSAGE WITHOUT DUPLICATES
// =====================================================

function addUniqueMessage(
    messages,
    incomingMessage
) {

    if (
        messages.some(
            (message) =>
                message._id ===
                incomingMessage._id
        )
    ) {

        return messages;

    }

    return [
        ...messages,
        incomingMessage
    ];

}


// =====================================================
// CHAT PAGE
// =====================================================

export default function ChatPage({

    token,
    onLogout,
    onHome,
    onProfile,

    // Used when Join Session opens chat
    initialUserId

}) {


    // =====================================================
    // CURRENT USER
    // =====================================================

    const currentUserId = useMemo(
        () => getUserId(token),
        [token]
    );


    // =====================================================
    // SOCKET
    // =====================================================

    const {
        socket,
        connected
    } = useSocket();


    // =====================================================
    // STATE
    // =====================================================

    const [
        conversations,
        setConversations
    ] = useState([]);


    const [
        selectedId,
        setSelectedId
    ] = useState(null);


    const [
        messages,
        setMessages
    ] = useState([]);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        sending,
        setSending
    ] = useState(false);


    const [
        error,
        setError
    ] = useState("");


    const [
        typingUserId,
        setTypingUserId
    ] = useState(null);


    const [
        showNewChat,
        setShowNewChat
    ] = useState(false);


    const [
        users,
        setUsers
    ] = useState([]);


    const [
        usersLoading,
        setUsersLoading
    ] = useState(false);


    const [
        creatingChat,
        setCreatingChat
    ] = useState(false);


    const typingTimer =
        useRef(null);


    const messagesEnd =
        useRef(null);


    const initialChatHandled =
        useRef(false);


    // =====================================================
    // SELECTED CONVERSATION
    // =====================================================

    const selectedConversation =
        conversations.find(
            (conversation) =>
                conversation._id ===
                selectedId
        );


    // =====================================================
    // CONTACT / OTHER USER
    // =====================================================

    const contact =
        selectedConversation
            ?.participants
            ?.find(
                (participant) =>
                    String(
                        participant._id
                    ) !==
                    String(
                        currentUserId
                    )
            );


    // =====================================================
    // REFRESH CONVERSATIONS
    // =====================================================

    const refreshConversations =
        useCallback(
            async () => {

                const result =
                    await fetchConversations();


                setConversations(
                    result
                );


                setSelectedId(
                    (current) => {

                        if (current) {
                            return current;
                        }

                        return (
                            result[0]?._id ||
                            null
                        );

                    }
                );


                return result;

            },
            []
        );


    // =====================================================
    // LOAD CONVERSATIONS
    // =====================================================

    useEffect(() => {

        let active = true;


        fetchConversations()

            .then((result) => {

                if (!active) {
                    return;
                }


                setConversations(
                    result
                );


                /*
                 * If ChatPage was opened normally,
                 * open first conversation.
                 *
                 * If opened using Join Session,
                 * the next effect will find the
                 * correct conversation.
                 */

                if (!initialUserId) {

                    setSelectedId(
                        result[0]?._id ||
                        null
                    );

                }

            })

            .catch((requestError) => {

                if (!active) {
                    return;
                }


                setError(
                    requestError
                        .response
                        ?.data
                        ?.message ||
                    "Could not load conversations"
                );

            })

            .finally(() => {

                if (active) {
                    setLoading(false);
                }

            });


        return () => {

            active = false;

        };

    }, [initialUserId]);


    // =====================================================
    // OPEN CHAT FOR JOIN SESSION
    // =====================================================

    useEffect(() => {

        if (
            !initialUserId ||
            initialChatHandled.current ||
            loading
        ) {
            return;
        }


        if (!Array.isArray(conversations)) {
            return;
        }


        // Find existing conversation
        const existingConversation =
            conversations.find(
                (conversation) => {

                    const participants =
                        conversation
                            ?.participants ||
                        [];

                    return participants.some(
                        (participant) =>
                            String(
                                participant._id
                            ) ===
                            String(
                                initialUserId
                            )
                    );

                }
            );


        if (existingConversation) {

            initialChatHandled.current =
                true;

            setSelectedId(
                existingConversation._id
            );

            setShowNewChat(false);

            return;

        }


        // No conversation exists.
        // Create one automatically.
        async function createSessionChat() {

            try {

                initialChatHandled.current =
                    true;

                setError("");


                const conversation =
                    await createConversation(
                        initialUserId
                    );


                setConversations(
                    (current) => {

                        const exists =
                            current.some(
                                (item) =>
                                    item._id ===
                                    conversation._id
                            );


                        if (exists) {
                            return current;
                        }


                        return [
                            conversation,
                            ...current
                        ];

                    }
                );


                setSelectedId(
                    conversation._id
                );


                setMessages([]);


            } catch (requestError) {

                console.error(
                    "Session chat creation error:",
                    requestError
                );


                setError(
                    requestError
                        ?.response
                        ?.data
                        ?.message ||
                    requestError.message ||
                    "Could not open session chat"
                );

            }

        }


        createSessionChat();


    }, [
        initialUserId,
        conversations,
        loading
    ]);


    // =====================================================
    // FETCH USERS FOR NEW CHAT
    // =====================================================

    async function openNewChat() {

        setShowNewChat(true);

        setError("");

        setUsersLoading(true);


        try {

            const apiBase =
                import.meta.env.VITE_API_URL;


            const response =
                await fetch(
                    `${apiBase}/getData`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load users"
                );

            }


            const allUsers =
                Array.isArray(
                    data.data
                )
                    ? data.data
                    : [];


            const otherUsers =
                allUsers.filter(
                    (user) =>
                        String(
                            user._id
                        ) !==
                        String(
                            currentUserId
                        )
                );


            setUsers(
                otherUsers
            );


        } catch (requestError) {

            console.error(
                "Load users error:",
                requestError
            );


            setError(
                requestError.message ||
                "Unable to load users"
            );


        } finally {

            setUsersLoading(false);

        }

    }


    // =====================================================
    // CREATE NEW CHAT
    // =====================================================

    async function handleCreateChat(
        user
    ) {

        if (!user?._id) {
            return;
        }


        try {

            setCreatingChat(
                true
            );

            setError("");


            const conversation =
                await createConversation(
                    user._id
                );


            setConversations(
                (current) => {

                    const exists =
                        current.some(
                            (item) =>
                                item._id ===
                                conversation._id
                        );


                    if (exists) {
                        return current;
                    }


                    return [
                        conversation,
                        ...current
                    ];

                }
            );


            setSelectedId(
                conversation._id
            );


            setMessages([]);


            setShowNewChat(
                false
            );


        } catch (requestError) {

            console.error(
                "Create chat error:",
                requestError
            );


            setError(
                requestError
                    ?.response
                    ?.data
                    ?.message ||
                "Could not create conversation"
            );


        } finally {

            setCreatingChat(
                false
            );

        }

    }


    // =====================================================
    // FETCH MESSAGES + SOCKET
    // =====================================================

    useEffect(() => {

        if (!selectedId) {
            return undefined;
        }


        let active = true;


        // Load existing messages
        fetchMessages(
            selectedId
        )

            .then((result) => {

                if (active) {

                    setMessages(
                        result
                    );

                }

            })

            .catch((requestError) => {

                if (!active) {
                    return;
                }


                setError(
                    requestError
                        ?.response
                        ?.data
                        ?.message ||
                    "Could not load messages"
                );

            });


        // No socket available
        if (!socket) {

            return () => {

                active = false;

            };

        }


        // =================================================
        // RECEIVE MESSAGE
        // =================================================

        const handleMessage =
            (message) => {

                if (
                    String(
                        message.conversation
                    ) !==
                    String(
                        selectedId
                    )
                ) {

                    return;

                }


                setMessages(
                    (current) =>
                        addUniqueMessage(
                            current,
                            message
                        )
                );


                refreshConversations();

            };


        // =================================================
        // TYPING START
        // =================================================

        const handleTypingStart =
            ({
                conversationId,
                userId
            }) => {

                if (
                    String(
                        conversationId
                    ) ===
                    String(
                        selectedId
                    )
                ) {

                    setTypingUserId(
                        userId
                    );

                }

            };


        // =================================================
        // TYPING STOP
        // =================================================

        const handleTypingStop =
            ({
                conversationId
            }) => {

                if (
                    String(
                        conversationId
                    ) ===
                    String(
                        selectedId
                    )
                ) {

                    setTypingUserId(
                        null
                    );

                }

            };


        // =================================================
        // CHAT ERROR
        // =================================================

        const handleChatError =
            ({
                message
            }) => {

                setError(
                    message
                );

            };


        // Join conversation room
        socket.emit(
            "join_conversation",
            {
                conversationId:
                    selectedId
            }
        );


        socket.on(
            "receive_message",
            handleMessage
        );


        socket.on(
            "typing_start",
            handleTypingStart
        );


        socket.on(
            "typing_stop",
            handleTypingStop
        );


        socket.on(
            "chat_error",
            handleChatError
        );


        return () => {

            active = false;


            socket.emit(
                "leave_conversation",
                {
                    conversationId:
                        selectedId
                }
            );


            socket.off(
                "receive_message",
                handleMessage
            );


            socket.off(
                "typing_start",
                handleTypingStart
            );


            socket.off(
                "typing_stop",
                handleTypingStop
            );


            socket.off(
                "chat_error",
                handleChatError
            );


            setTypingUserId(
                null
            );

        };

    }, [
        refreshConversations,
        selectedId,
        socket
    ]);


    // =====================================================
    // AUTO SCROLL
    // =====================================================

    useEffect(() => {

        messagesEnd.current
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }, [
        messages,
        typingUserId
    ]);


    // =====================================================
    // CLEANUP TYPING TIMER
    // =====================================================

    useEffect(() => {

        return () => {

            clearTimeout(
                typingTimer.current
            );

        };

    }, []);


    // =====================================================
    // SEND MESSAGE
    // =====================================================

    async function handleSend(
        content
    ) {

        if (!selectedId) {
            return false;
        }


        try {

            setSending(true);

            setError("");


            // REST fallback
            if (!socket?.connected) {

                const message =
                    await sendMessageWithApi(
                        selectedId,
                        content
                    );


                setMessages(
                    (current) =>
                        addUniqueMessage(
                            current,
                            message
                        )
                );


                await refreshConversations();


                return true;

            }


            // Socket send
            return await new Promise(
                (resolve) => {

                    socket
                        .timeout(7000)
                        .emit(
                            "send_message",
                            {
                                conversationId:
                                    selectedId,
                                content
                            },
                            (
                                timeoutError,
                                response
                            ) => {

                                if (
                                    timeoutError ||
                                    !response?.ok
                                ) {

                                    setError(
                                        response
                                            ?.message ||
                                        "Message could not be sent"
                                    );


                                    resolve(
                                        false
                                    );

                                    return;

                                }


                                resolve(
                                    true
                                );

                            }
                        );

                }
            );


        } catch (
            requestError
        ) {

            setError(
                requestError
                    ?.response
                    ?.data
                    ?.message ||
                "Message could not be sent"
            );


            return false;


        } finally {

            setSending(
                false
            );

        }

    }


    // =====================================================
    // TYPING
    // =====================================================

    function handleTyping(
        isTyping
    ) {

        if (
            !socket ||
            !selectedId
        ) {

            return;

        }


        clearTimeout(
            typingTimer.current
        );


        socket.emit(
            isTyping
                ? "typing_start"
                : "typing_stop",
            {
                conversationId:
                    selectedId
            }
        );


        if (isTyping) {

            typingTimer.current =
                setTimeout(
                    () => {

                        socket.emit(
                            "typing_stop",
                            {
                                conversationId:
                                    selectedId
                            }
                        );

                    },
                    1000
                );

        }

    }


    // =====================================================
    // SELECT CHAT
    // =====================================================

    function handleSelect(
        conversationId
    ) {

        setMessages([]);

        setSelectedId(
            conversationId
        );

        setShowNewChat(
            false
        );

        setError("");

    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <main className="chat-page">


            {/* =================================================
                TOP BAR
            ================================================= */}

            <header className="chat-topbar">

                <div>

                    <span className="eyebrow">
                        Skill Exchange
                    </span>

                    <h1>
                        Messages
                    </h1>

                </div>


                <div className="chat-account-actions">

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onHome}
                    >
                        Home
                    </button>


                    <span
                        className={
                            `connection-status${
                                connected
                                    ? " is-online"
                                    : ""
                            }`
                        }
                    >
                        {connected
                            ? "Live"
                            : "Reconnecting"}
                    </span>


                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onProfile}
                    >
                        Profile
                    </button>


                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onLogout}
                    >
                        Log out
                    </button>

                </div>

            </header>


            {/* =================================================
                ERROR
            ================================================= */}

            {error ? (

                <div
                    className="chat-alert"
                    role="alert"
                >
                    {error}
                </div>

            ) : null}


            {/* =================================================
                CHAT SHELL
            ================================================= */}

            <section
                className="chat-shell"
                aria-label="Chat"
            >


                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <aside className="chat-sidebar">

                    <div className="sidebar-heading">

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap:
                                    "10px"
                            }}
                        >

                            <h2>
                                Conversations
                            </h2>

                            <span>
                                {
                                    conversations.length
                                }
                            </span>

                        </div>


                        <button
                            type="button"
                            className="new-chat-button"
                            onClick={
                                openNewChat
                            }
                        >
                            + New Chat
                        </button>

                    </div>


                    {loading ? (

                        <p className="chat-empty-list">
                            Loading conversations...
                        </p>

                    ) : (

                        <ChatList
                            conversations={
                                conversations
                            }
                            currentUserId={
                                currentUserId
                            }
                            selectedId={
                                selectedId
                            }
                            onSelect={
                                handleSelect
                            }
                        />

                    )}

                </aside>


                {/* =================================================
                    MAIN THREAD
                ================================================= */}

                <section
                    className="chat-thread"
                    aria-label={
                        contact
                            ? `Chat with ${contact.name}`
                            : "Messages"
                    }
                >


                    {/* =================================================
                        NEW CHAT
                    ================================================= */}

                    {showNewChat ? (

                        <div className="new-chat-panel">

                            <p className="new-chat-eyebrow">
                                Start a conversation
                            </p>


                            <h2>
                                Who do you want to chat with?
                            </h2>


                            <p className="new-chat-description">
                                Choose a mentor or learner
                                to start a direct conversation.
                            </p>


                            <button
                                type="button"
                                className="new-chat-close"
                                onClick={() => {

                                    setShowNewChat(
                                        false
                                    );

                                    setError("");

                                }}
                            >
                                Close
                            </button>


                            {usersLoading ? (

                                <p className="new-chat-loading">
                                    Loading mentors and learners...
                                </p>

                            ) : users.length === 0 ? (

                                <p className="new-chat-empty">
                                    No other users are available.
                                </p>

                            ) : (

                                <div className="new-chat-users">

                                    {users.map(
                                        (user) => (

                                            <button
                                                type="button"
                                                key={
                                                    user._id
                                                }
                                                className="new-chat-user"
                                                disabled={
                                                    creatingChat
                                                }
                                                onClick={() =>
                                                    handleCreateChat(
                                                        user
                                                    )
                                                }
                                            >

                                                <span className="new-chat-user-avatar">

                                                    {user.name
                                                        ?.charAt(
                                                            0
                                                        )
                                                        .toUpperCase() ||
                                                        "?"}

                                                </span>


                                                <span className="new-chat-user-info">

                                                    <span className="new-chat-user-name">
                                                        {
                                                            user.name
                                                        }
                                                    </span>


                                                    <span className="new-chat-user-role">
                                                        {
                                                            user.role ||
                                                            "user"
                                                        }
                                                    </span>

                                                </span>


                                                <span className="new-chat-user-arrow">
                                                    →
                                                </span>

                                            </button>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                    ) : selectedConversation ? (


                        /* =================================================
                           NORMAL CHAT
                        ================================================= */

                        <>

                            <header className="thread-header">

                                <span
                                    className="chat-avatar"
                                    aria-hidden="true"
                                >
                                    {(
                                        contact?.name ||
                                        "?"
                                    )
                                        .slice(
                                            0,
                                            1
                                        )
                                        .toUpperCase()}
                                </span>


                                <div>

                                    <h2>
                                        {
                                            contact?.name ||
                                            "Unknown user"
                                        }
                                    </h2>


                                    <p>
                                        {
                                            selectedConversation.bookingId
                                                ? "Booked session chat"
                                                : "Direct skill chat"
                                        }
                                    </p>

                                </div>

                            </header>


                            <div
                                className="message-stream"
                                aria-live="polite"
                            >

                                {messages.length === 0 ? (

                                    <div className="empty-thread">

                                        <span aria-hidden="true">
                                            ✦
                                        </span>


                                        <h3>
                                            Start the conversation
                                        </h3>


                                        <p>
                                            Ask a question,
                                            share a resource,
                                            or plan your next session.
                                        </p>

                                    </div>

                                ) : (

                                    messages.map(
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
                                                        message.sender?._id ||
                                                        message.sender
                                                    ) ===
                                                    String(
                                                        currentUserId
                                                    )
                                                }
                                            />

                                        )
                                    )

                                )}


                                {typingUserId ? (

                                    <p className="typing-indicator">

                                        {
                                            contact?.name ||
                                            "User"
                                        }{" "}
                                        is typing...

                                    </p>

                                ) : null}


                                <div
                                    ref={
                                        messagesEnd
                                    }
                                />

                            </div>


                            <MessageInput
                                disabled={
                                    sending
                                }
                                onSend={
                                    handleSend
                                }
                                onTyping={
                                    handleTyping
                                }
                            />

                        </>


                    ) : (


                        /* =================================================
                           NO CHAT SELECTED
                        ================================================= */

                        <div className="empty-thread no-selection">

                            <span aria-hidden="true">
                                ✦
                            </span>


                            <h2>
                                Your conversations
                                will appear here
                            </h2>


                            <p>
                                Start a new chat with a
                                mentor or learner using
                                the{" "}
                                <strong>
                                    + New Chat
                                </strong>{" "}
                                button.
                            </p>

                        </div>

                    )}

                </section>

            </section>

        </main>

    );

}