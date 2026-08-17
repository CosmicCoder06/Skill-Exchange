import React, { useEffect, useState } from "react";
import axios from "axios";

function AdminDashboard() {

    const [user, setUser] = useState([]);

    const token = localStorage.getItem("Token");

    async function adminUser() {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/getData/admin/api`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setUser(response.data.data);

        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        adminUser();
    }, []);

    return (
        <>
            <h1>This Admin Dashboard</h1>
        </>
    );
}

export default AdminDashboard;