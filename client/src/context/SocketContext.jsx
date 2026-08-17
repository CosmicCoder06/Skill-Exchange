import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import SocketContext from "./socketContextValue";

export function SocketProvider({ token, children }) {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!token) return undefined;

        const instance = io(
            import.meta.env.VITE_SOCKET_URL ||
            "io(import.meta.env.VITE_SOCKET_URL)",
            {
                auth: {
                    token: token
                }
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
            console.error(
                "Socket connection error:",
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
            instance.disconnect();
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