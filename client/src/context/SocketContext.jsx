import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import SocketContext from "./socketContextValue";

export function SocketProvider({ token, children }) {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!token) return undefined;

        const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
        const instance = io(
            socketUrl,
            {
                auth: {
                    token: token
                },
                transports: ['polling', 'websocket'],
                reconnectionAttempts: 5,
                timeout: 10000
            }
        );

        const handleConnect = () => {
            console.log("Socket connected:", instance.id);
            setSocket(instance);
            setConnected(true);
        };

        const handleDisconnect = (reason) => {
            console.log("Socket disconnected:", reason);
            setSocket(null);
            setConnected(false);
        };

        const handleConnectError = (error) => {
            console.warn(
                "Socket connection notice:",
                error.message
            );
        };

        instance.on("connect", handleConnect);
        instance.on("disconnect", handleDisconnect);
        instance.on("connect_error", handleConnectError);

        return () => {
            instance.off("connect", handleConnect);
            instance.off("disconnect", handleDisconnect);
            instance.off("connect_error", handleConnectError);
            if (instance.connected) {
                instance.disconnect();
            } else {
                instance.close();
            }
        };
    }, [token]);

    const value = useMemo(
        () => ({
            socket,
            connected
        }),
        [socket, connected]
    );

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}
// @teamcosmiccoders
