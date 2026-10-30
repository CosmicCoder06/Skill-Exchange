import React from "react";

export function LogoMark({ size = 36, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`se-logo-mark ${className}`}
      aria-label="Skill Exchange"
      role="img"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <title>Skill Exchange</title>
      <polygon
        points="50,2 98,33 80,98 20,98 2,33"
        fill="var(--logo-polygon-fill, #176b4e)"
        stroke="var(--logo-polygon-stroke, #176b4e)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text
        x="50"
        y="66"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="900"
        fontSize="40"
        fill="var(--logo-text-fill, #ffffff)"
        textAnchor="middle"
        letterSpacing="-2"
      >
        SE
      </text>
    </svg>
  );
}

export default function Logo({
  size = 36,
  showText = false,
  className = "",
  text = "Skill",
  textHighlight = "Exchange"
}) {
  return (
    <span
      className={`se-logo-wrapper ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "9px"
      }}
    >
      <LogoMark size={size} />
      {showText && (
        <span
          className="se-logo-text"
          style={{
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "inherit"
          }}
        >
          {text}
          <span style={{ fontWeight: 500, color: "var(--logo-highlight, #176b4e)" }}>
            {textHighlight}
          </span>
        </span>
      )}
    </span>
  );
}
