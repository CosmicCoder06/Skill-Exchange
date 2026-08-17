import React, { useState } from "react";
import axios from "axios";

function UpdateRegisterCard({ user, onClose, id }) {
    const [formData, setFormData] = useState({
        name: "",
        email: ""
    });

    function handleChange(e) {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    async function handleUpdate(e) {
        e.preventDefault();

        try {
            console.log("userId");

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/user/update/${id._id}`,
                formData
            );

            console.log(response.data);

            alert("Data has been successfully UPDATED");

            setFormData({
                name: "",
                email: ""
            });

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <>
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >
                <div
                    style={{
                        width: "400px",
                        background: "white",
                        padding: "24px"
                    }}
                >
                    <h1>User Updation Form</h1>

                    <input
                        onChange={handleChange}
                        type="text"
                        name="name"
                        placeholder="Update Your Name"
                        value={formData.name}
                    />

                    <br />
                    <br />

                    <input
                        onChange={handleChange}
                        type="text"
                        name="email"
                        placeholder="Update Your Email"
                        value={formData.email}
                    />

                    <br />
                    <br />

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between"
                        }}
                    >
                        <button onClick={handleUpdate}>
                            Update
                        </button>

                        <button onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default UpdateRegisterCard;