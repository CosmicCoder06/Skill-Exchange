import { useState } from "react";

const REASONS = [
    [
        "inappropriate",
        "Inappropriate / NSFW image",
    ],
    [
        "offensive",
        "Offensive or abusive content",
    ],
    [
        "misleading",
        "Fake or misleading profile image",
    ],
    [
        "someone_else",
        "Image contains someone else",
    ],
    [
        "guidelines",
        "Community guideline violation",
    ],
    [
        "low_quality",
        "Low quality / unusable image",
    ],
    [
        "other",
        "Other",
    ],
];

function getInitial(name) {
    return (
        name
            ?.trim()
            ?.charAt(0)
            ?.toUpperCase() ||
        "?"
    );
}

function formatDate(date) {
    if (!date) return "—";

    try {
        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        ).format(new Date(date));
    } catch {
        return "—";
    }
}

function getAvatar(user) {
    return (
        user?.avatarUrl ||
        user?.profilePhoto ||
        user?.profileImage ||
        user?.avatar ||
        ""
    );
}

export default function AdminUserTable({
    users = [],
    currentUserId,
    busyUserId,
    onUpdate,
    onDelete,
    onRemovePhoto,
}) {
    const [previewUser, setPreviewUser] =
        useState(null);

    const [removeUser, setRemoveUser] =
        useState(null);

    const [reason, setReason] =
        useState("");

    const [customReason, setCustomReason] =
        useState("");

    function closeRemoveModal() {
        setRemoveUser(null);
        setReason("");
        setCustomReason("");
    }

    async function submitPhotoRemoval() {
        if (!removeUser || !reason) {
            return;
        }

        if (
            reason === "other" &&
            !customReason.trim()
        ) {
            return;
        }

        const finalReason =
            reason === "other"
                ? customReason.trim()
                : reason;

        await onRemovePhoto(
            removeUser,
            finalReason
        );

        closeRemoveModal();
    }

    if (!users.length) {
        return (
            <div className="admin-empty-state">

                <div className="admin-empty-icon">
                    ⌕
                </div>

                <h3>
                    No members found
                </h3>

                <p>
                    Try changing your search
                    or filters.
                </p>

            </div>
        );
    }

    return (
        <>
            <div className="admin-table-wrap">

                <table className="admin-users-table">

                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Role</th>
                            <th>Verification</th>
                            <th>Profile</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        {users.map((user) => {
                            const isSelf =
                                String(user._id) ===
                                String(currentUserId);

                            const busy =
                                String(busyUserId) ===
                                String(user._id);

                            const active =
                                user.isActive !== false;

                            const verified =
                                user.isVerified === true;

                            const avatarUrl =
                                getAvatar(user);

                            const hasAvatar =
                                Boolean(avatarUrl);

                            return (
                                <tr
                                    key={user._id}
                                    className={
                                        isSelf
                                            ? "is-self"
                                            : ""
                                    }
                                >

                                    <td>
                                        <div className="admin-member-cell">

                                            <button
                                                type="button"
                                                className="admin-member-avatar-button"
                                                disabled={!hasAvatar}
                                                onClick={() => {
                                                    if (
                                                        hasAvatar
                                                    ) {
                                                        setPreviewUser(
                                                            {
                                                                ...user,
                                                                avatarUrl,
                                                            }
                                                        );
                                                    }
                                                }}
                                            >
                                                {hasAvatar ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt={
                                                            user.name ||
                                                            "Member"
                                                        }
                                                        className="admin-member-avatar-image"
                                                    />
                                                ) : (
                                                    <span className="admin-member-avatar">
                                                        {getInitial(
                                                            user.name
                                                        )}
                                                    </span>
                                                )}

                                                {hasAvatar && (
                                                    <span className="admin-avatar-view-icon">
                                                        ↗
                                                    </span>
                                                )}
                                            </button>

                                            <div>
                                                <strong>
                                                    {user.name ||
                                                        "Unnamed member"}
                                                </strong>

                                                <span>
                                                    {user.email ||
                                                        "No email"}
                                                </span>

                                                {isSelf && (
                                                    <small>
                                                        Your account
                                                    </small>
                                                )}
                                            </div>

                                        </div>
                                    </td>

                                    <td>
                                        <select
                                            className="admin-role-select"
                                            value={
                                                user.role ||
                                                "learner"
                                            }
                                            disabled={
                                                busy ||
                                                isSelf
                                            }
                                            onChange={(e) =>
                                                onUpdate(
                                                    user._id,
                                                    {
                                                        role: e
                                                            .target
                                                            .value,
                                                    }
                                                )
                                            }
                                        >
                                            <option value="learner">
                                                Learner
                                            </option>

                                            <option value="mentor">
                                                Mentor
                                            </option>

                                            <option value="admin">
                                                Admin
                                            </option>
                                        </select>
                                    </td>

                                    <td>
                                        <span
                                            className={
                                                verified
                                                    ? "admin-verification verified"
                                                    : "admin-verification pending"
                                            }
                                        >
                                            <span className="admin-status-dot" />

                                            {verified
                                                ? "Verified"
                                                : "Unverified"}
                                        </span>
                                    </td>

                                    <td>
                                        <span
                                            className={
                                                user.profileCompleted
                                                    ? "admin-profile-state complete"
                                                    : "admin-profile-state"
                                            }
                                        >
                                            {user.profileCompleted
                                                ? "Complete"
                                                : "In progress"}
                                        </span>
                                    </td>

                                    <td>
                                        <span
                                            className={
                                                active
                                                    ? "admin-account-state active"
                                                    : "admin-account-state suspended"
                                            }
                                        >
                                            <span className="admin-status-dot" />

                                            {active
                                                ? "Active"
                                                : "Suspended"}
                                        </span>
                                    </td>

                                    <td>
                                        <time className="admin-joined-date">
                                            {formatDate(
                                                user.createdAt
                                            )}
                                        </time>
                                    </td>

                                    <td>
                                        <div className="admin-row-actions">

                                            {hasAvatar && (
                                                <button
                                                    type="button"
                                                    className="admin-action-photo"
                                                    disabled={
                                                        busy ||
                                                        isSelf
                                                    }
                                                    onClick={() =>
                                                        setRemoveUser(
                                                            {
                                                                ...user,
                                                                avatarUrl,
                                                            }
                                                        )
                                                    }
                                                >
                                                    Remove photo
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="admin-action-secondary"
                                                disabled={
                                                    busy ||
                                                    isSelf
                                                }
                                                onClick={() =>
                                                    onUpdate(
                                                        user._id,
                                                        {
                                                            isActive:
                                                                !active,
                                                        }
                                                    )
                                                }
                                            >
                                                {active
                                                    ? "Suspend"
                                                    : "Activate"}
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-action-delete"
                                                disabled={
                                                    busy ||
                                                    isSelf
                                                }
                                                onClick={() =>
                                                    onDelete(
                                                        user
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>
                                    </td>

                                </tr>
                            );
                        })}

                    </tbody>

                </table>

            </div>

            {previewUser && (
                <div
                    className="admin-modal-backdrop"
                    onClick={() =>
                        setPreviewUser(null)
                    }
                >
                    <div
                        className="admin-photo-preview-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <button
                            type="button"
                            className="admin-modal-close"
                            onClick={() =>
                                setPreviewUser(null)
                            }
                        >
                            ×
                        </button>

                        <img
                            src={previewUser.avatarUrl}
                            alt={
                                previewUser.name ||
                                "Profile"
                            }
                        />

                        <div className="admin-photo-preview-info">
                            <strong>
                                {previewUser.name}
                            </strong>

                            <span>
                                {previewUser.email}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {removeUser && (
                <div
                    className="admin-modal-backdrop"
                    onClick={
                        closeRemoveModal
                    }
                >
                    <div
                        className="admin-remove-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="admin-remove-modal-icon">
                            !
                        </div>

                        <p className="admin-modal-eyebrow">
                            MODERATION ACTION
                        </p>

                        <h3>
                            Remove profile photo?
                        </h3>

                        <p className="admin-modal-copy">
                            Select a reason for
                            removing{" "}
                            <strong>
                                {removeUser.name}
                            </strong>{" "}
                            profile photo.
                        </p>

                        <div className="admin-reason-list">

                            {REASONS.map(
                                ([value, label]) => (
                                    <label
                                        key={value}
                                        className={
                                            reason ===
                                            value
                                                ? "admin-reason-option selected"
                                                : "admin-reason-option"
                                        }
                                    >
                                        <input
                                            type="radio"
                                            name="photo-removal-reason"
                                            value={value}
                                            checked={
                                                reason ===
                                                value
                                            }
                                            onChange={(e) =>
                                                setReason(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                        />

                                        <span>
                                            {label}
                                        </span>
                                    </label>
                                )
                            )}

                        </div>

                        {reason ===
                            "other" && (
                            <textarea
                                className="admin-custom-reason"
                                placeholder="Tell us why this image should be removed..."
                                value={
                                    customReason
                                }
                                onChange={(e) =>
                                    setCustomReason(
                                        e.target
                                            .value
                                    )
                                }
                                maxLength={500}
                            />
                        )}

                        <div className="admin-modal-actions">

                            <button
                                type="button"
                                className="admin-modal-cancel"
                                onClick={
                                    closeRemoveModal
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="admin-modal-confirm"
                                disabled={
                                    !reason ||
                                    busyUserId ||
                                    (reason ===
                                        "other" &&
                                        !customReason.trim())
                                }
                                onClick={
                                    submitPhotoRemoval
                                }
                            >
                                Remove photo
                            </button>

                        </div>

                    </div>
                </div>
            )}
        </>
    );
}