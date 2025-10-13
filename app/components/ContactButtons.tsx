"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

type Props = { phone?: string | null; email?: string | null };

const btnBase: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 12px",
  fontWeight: 600,
  cursor: "pointer",
  background: "#fff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  whiteSpace: "nowrap",
  color: "#111",
  textDecoration: "none",
};

const rowWrap: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };

function onlyDigits(s?: string | null) {
  if (!s) return "";
  return s.replace(/[^\d+]/g, "");
}

export default function ContactButtons({ phone, email }: Props) {
  const router = useRouter();
  const tel = onlyDigits(phone);
  const sms = tel ? `sms:${tel}` : undefined;
  const telHref = tel ? `tel:${tel}` : undefined;
  const mailHref = email ? `mailto:${email}` : undefined;

  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/listings");
  };

  return (
    <div style={rowWrap}>
      <button style={btnBase} onClick={onBack} aria-label="Go Back">⬅ Back</button>
      <a href={telHref} style={{ ...btnBase, pointerEvents: telHref ? "auto" : "none", opacity: telHref ? 1 : 0.5 }} aria-disabled={!telHref}>📞 Call</a>
      <a href={sms} style={{ ...btnBase, pointerEvents: sms ? "auto" : "none", opacity: sms ? 1 : 0.5 }} aria-disabled={!sms}>💬 Text</a>
      <a href={mailHref} style={{ ...btnBase, pointerEvents: mailHref ? "auto" : "none", opacity: mailHref ? 1 : 0.5 }} aria-disabled={!mailHref}>✉️ Email</a>
    </div>
  );
}
