import React from "react";

export default function Privacy() {
  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "2rem" }}>
      {/* Logo */}
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <div style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: "16px",
          marginBottom: "1rem"
        }}>
          {/* Logo placeholder - replace with actual logo component/image */}
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
            border: "2px solid #10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#10b981",
            fontSize: "24px",
            fontWeight: "bold"
          }}>
            🧭
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#0891b2", lineHeight: 1 }}>
              OFF
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#0891b2", lineHeight: 1 }}>
              AXIS
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#0891b2", lineHeight: 1 }}>
              DEALS
            </div>
          </div>
        </div>
      </div>

      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        Off Axis Deals (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) values your privacy. This Privacy Policy explains 
        how we collect, use, and protect your information.
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect information you provide (name, email, payment details) and automatically 
        gathered data (IP address, browser type, usage analytics).
      </p>

      <h2>2. Use of Information</h2>
      <p>
        We use your data to operate, improve, and secure the Platform; manage accounts; process 
        payments; and communicate updates or offers.
      </p>

      <h2>3. Data Sharing</h2>
      <p>
        We share data only with trusted vendors such as Stripe for payments and Supabase for 
        hosting and authentication. We never sell your personal data.
      </p>

      <h2>4. Security</h2>
      <p>
        We use encryption, access controls, and monitoring to protect your data. No system is 
        100% secure, but we work to minimize risk.
      </p>

      <h2>5. Your Rights</h2>
      <p>
        You may request access, correction, or deletion of your personal data by contacting 
        customerservice@offaxisdeals.com.
      </p>

      <h2>6. Cookies</h2>
      <p>
        We use cookies to improve experience and analytics. You may disable cookies in your 
        browser, but some functions may stop working.
      </p>

      <h2>7. Retention</h2>
      <p>
        We retain information as long as your account is active or as required by law.
      </p>

      <h2>8. Updates</h2>
      <p>
        We may revise this Privacy Policy periodically. The new policy will be posted on this page 
        with an updated date.
      </p>
    </div>
  );
}
