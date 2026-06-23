"use client";
// app/LangSwitcher.tsx — toggle the locale cookie (ar <-> en) and reload.

export default function LangSwitcher({ label }: { label: string }) {
  function toggle() {
    const isEn = document.cookie.split("; ").some((c) => c === "locale=en");
    document.cookie = `locale=${isEn ? "ar" : "en"}; path=/; max-age=31536000`;
    window.location.reload();
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle language"
      style={{
        font: "inherit",
        fontWeight: 700,
        fontSize: "0.85rem",
        padding: "6px 12px",
        borderRadius: 999,
        border: "1px solid var(--geo-line, #e2dfd4)",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}
