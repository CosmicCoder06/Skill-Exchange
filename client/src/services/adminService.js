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
        data = {
            message: text,
        };
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
                data?.error ||
                `Admin request failed (${response.status})`
        );
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

    const queryString =
        query.toString();

    return adminRequest(
        `/admin/users${
            queryString
                ? `?${queryString}`
                : ""
        }`,
        token
    );
}

export async function fetchAdminUsers(
    token,
    params = {}
) {
    return getAdminUsers(
        token,
        params
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
   UPDATE USER
========================================================= */

export async function updateAdminUser(
    token,
    userId,
    updates
) {
    return adminRequest(
        `/admin/users/${userId}`,
        token,
        {
            method: "PATCH",

            body: JSON.stringify(
                updates
            ),
        }
    );
}

/* =========================================================
   DELETE USER
========================================================= */

export async function deleteAdminUser(
    token,
    userId
) {
    return adminRequest(
        `/admin/users/${userId}`,
        token,
        {
            method: "DELETE",
        }
    );
}

/* =========================================================
   REMOVE PROFILE PHOTO
========================================================= */

export async function removeAdminUserPhoto(
    token,
    userId,
    reason
) {
    return adminRequest(
        `/admin/users/${userId}/avatar`,
        token,
        {
            method: "DELETE",

            body: JSON.stringify({
                reason,
            }),
        }
    );
}