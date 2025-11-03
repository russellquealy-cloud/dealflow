import React from "react";

export default function Disclaimer() {
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

      <h1>Disclaimer</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. General Information</h2>
      <p>
        The data and analyses provided by Off Axis Deals (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) are for informational 
        and educational purposes only. We do not guarantee accuracy, completeness, or suitability of 
        any property information or valuation.
      </p>

      <h2>2. No Financial or Legal Advice</h2>
      <p>
        Nothing on this platform constitutes financial, legal, or investment advice. Users should 
        perform independent due diligence or consult a licensed professional before making business, 
        lending, or real-estate decisions.
      </p>

      <h2>3. Limitation of Liability</h2>
      <p>
        Off Axis Deals is not liable for any loss, damage, or expense resulting from reliance on 
        information or tools provided through the Platform, including automated valuations and AI 
        estimates.
      </p>

      <h2>4. External Links</h2>
      <p>
        Links to third-party websites are provided for convenience only. We do not endorse, control, 
        or assume responsibility for external content or privacy practices.
      </p>

      <h2>5. Updates</h2>
      <p>
        This disclaimer may be updated periodically. Continued use of the Platform implies acceptance 
        of any changes.
      </p>
    </div>
  );
}

