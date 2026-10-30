import { useEffect } from "react";
import { X } from "lucide-react";
import "./Modal.css";

export default function Modal({
    isOpen,
    onClose,
    title,
    eyebrow,
    subtitle,
    icon,
    maxWidth = "md",
    children,
    footer,
    className = ""
}) {
    // Handle Escape key and body scroll locking
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose?.();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClass = {
        sm: "modal-size-sm",
        md: "modal-size-md",
        lg: "modal-size-lg",
        xl: "modal-size-xl"
    }[maxWidth] || "";

    const customStyle = !["sm", "md", "lg", "xl"].includes(maxWidth) && maxWidth
        ? { maxWidth }
        : undefined;

    return (
        <div
            className="se-shared-modal-backdrop"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title-heading" : undefined}
        >
            <div
                className={`se-shared-modal-card ${sizeClass} ${className}`}
                style={customStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {(title || eyebrow || subtitle || onClose) && (
                    <header className="se-shared-modal-header">
                        <div className="se-shared-modal-title-group">
                            {icon && <div className="se-shared-modal-icon-badge">{icon}</div>}
                            <div className="se-shared-modal-headings">
                                {eyebrow && <span className="se-shared-modal-eyebrow">{eyebrow}</span>}
                                {title && <h3 id="modal-title-heading">{title}</h3>}
                                {subtitle && <p className="se-shared-modal-subtitle">{subtitle}</p>}
                            </div>
                        </div>

                        {onClose && (
                            <button
                                type="button"
                                className="se-shared-modal-close-btn"
                                onClick={onClose}
                                aria-label="Close dialog"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </header>
                )}

                <div className="se-shared-modal-body">
                    {children}
                </div>

                {footer && (
                    <footer className="se-shared-modal-footer">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
}
