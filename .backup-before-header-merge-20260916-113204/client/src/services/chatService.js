import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("Token")

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

export async function fetchConversations() {
    const response = await api.get("/conversations")
    return response.data.conversations || []
}

export async function fetchMessages(conversationId) {
    const response = await api.get(
        `/conversations/${conversationId}/messages`
    )
    return response.data.messages || []
}

export async function createConversation(
    participantId,
    bookingId
) {
    const response = await api.post("/conversations", {
        participantId,
        ...(bookingId ? { bookingId } : {}),
    })

    return response.data.conversation
}

export async function sendMessage(
    conversationId,
    content
) {
    const response = await api.post(
        `/conversations/${conversationId}/messages`,
        { content }
    )

    return response.data.message
}

export async function markConversationRead(
    conversationId
) {
    const response = await api.patch(
        `/conversations/${conversationId}/read`
    )

    return response.data
}

export async function editMessage(
    messageId,
    content
) {
    const response = await api.patch(
        `/messages/${messageId}`,
        { content }
    )

    return response.data.message
}

export async function deleteMessage(
    messageId,
    mode = "me"
) {
    const response = await api.delete(
        `/messages/${messageId}`,
        {
            data: { mode },
        }
    )

    return response.data
}

export async function deleteConversation(
    conversationId
) {
    const response = await api.delete(
        `/conversations/${conversationId}`
    )

    return response.data
}

export async function fetchUsers() {
    const response = await api.get("/getData")
    return response.data.data || []
}
