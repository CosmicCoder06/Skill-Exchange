const API_BASE =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

async function adminRequest(
    path,
    token,
    options = {}
) {
    const response = await fetch(
        `${API_BASE}${path}`,
        {
            ...options,

            headers: {
                ...(options.body
                    ? {
                        "Content-Type":
                            "application/json",
                    }
                    : {}),

                ...(token
                    ? {
                        Authorization:
                            `Bearer ${token}`,
                    }
                    : {}),

                ...(options.headers || {}),
            },
        }
    );

    const text =
        await response.text();

    let data;

    try {
        data = text
            ? JSON.parse(text)
            : {};
    } catch {
        const match = text.match(/<pre>(.*?)<\/pre>/i);
        const cleanMsg = match
            ? match[1]
            : (text.includes("<html") || text.includes("<!DOCTYPE")
                ? `Backend service error (${response.status})`
                : text);
        data = {
            message: cleanMsg,
        };
    }

    if (!response.ok) {
        let msg = data?.message || data?.error || `Admin request failed (${response.status})`;
        if (typeof msg === "string" && (msg.includes("<!DOCTYPE") || msg.includes("<html"))) {
            const match = msg.match(/<pre>(.*?)<\/pre>/i);
            msg = match ? match[1] : `Backend endpoint not available (${response.status})`;
        }
        throw new Error(msg);
    }

    return data;
}

/* =========================================================
   OVERVIEW
========================================================= */

export async function getAdminOverview(
    token
) {
    return adminRequest(
        "/admin/overview",
        token
    );
}

export async function getAdminStats(token) {
    return adminRequest("/admin/stats", token);
}

export async function getAdminUserDetails(token, id) {
    return adminRequest(`/admin/users/${id}`, token);
}

export async function getAdminSessions(token, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });
    const qs = query.toString();
    return adminRequest(`/admin/sessions${qs ? `?${qs}` : ""}`, token);
}

export async function fetchAdminOverview(
    token
) {
    return getAdminOverview(token);
}

/* =========================================================
   USERS
========================================================= */

export async function getAdminUsers(
    token,
    params = {}
) {
    const query =
        new URLSearchParams();

    Object.entries(params).forEach(
        ([key, value]) => {
            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                query.set(
                    key,
                    value
                );
            }
        }
    );

    const qs = query.toString();

    return adminRequest(
        `/admin/users${
            qs ? `?${qs}` : ""
        }`,
        token
    );
}

export async function updateAdminUser(
    token,
    id,
    data
) {
    return adminRequest(
        `/admin/users/${id}`,
        token,
        {
            method: "PATCH",
            body: JSON.stringify(data),
        }
    );
}

export async function deleteAdminUser(
    token,
    id
) {
    return adminRequest(
        `/admin/users/${id}`,
        token,
        {
            method: "DELETE",
        }
    );
}

export async function removeAdminUserPhoto(
    token,
    id
) {
    return adminRequest(
        `/admin/users/${id}`,
        token,
        {
            method: "PATCH",
            body: JSON.stringify({
                avatarUrl: "",
            }),
        }
    );
}

/* =========================================================
   REPORTS
========================================================= */

export async function getAdminReports(
    token
) {
    return adminRequest(
        "/admin/reports",
        token
    );
}

export async function fetchAdminReports(
    token
) {
    return getAdminReports(token);
}

/* =========================================================
   PAYMENTS & PAYOUTS
========================================================= */

export async function getAdminPayments(token, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });
    const qs = query.toString();
    return adminRequest(`/admin/payments${qs ? `?${qs}` : ""}`, token);
}

export async function getAdminPendingPayments(token) {
    return adminRequest("/admin/payments/pending", token);
}

export async function verifyAdminPayment(token, bookingId, data) {
    return adminRequest(`/admin/payments/${bookingId}/verify`, token, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getAdminPayouts(token) {
    return adminRequest("/admin/payments/payouts", token);
}

export async function settleAdminPayouts(token, data) {
    return adminRequest("/admin/payouts/settle", token, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getAdminPayoutHistory(token, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });
    const qs = query.toString();
    return adminRequest(`/admin/payouts/history${qs ? `?${qs}` : ""}`, token);
}

export async function getAdminRefunds(token) {
    return adminRequest("/admin/refunds", token);
}

export async function refundAdminRazorpay(token, bookingId, data = {}) {
    return adminRequest(`/admin/refunds/${bookingId}`, token, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function markAdminPaidOut(token, bookingId, data) {
    return adminRequest(`/admin/payments/${bookingId}/payout`, token, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function refundAdminBooking(token, bookingId, data) {
    return adminRequest(`/admin/payments/${bookingId}/refund`, token, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function downloadPaymentLedger(token) {
    const res = await fetch(`${API_BASE}/admin/payments/ledger.csv`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error("Failed to download ledger CSV");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}
// @teamcosmiccoders
