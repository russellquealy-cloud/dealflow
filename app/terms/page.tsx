import React from "react";

export default function Terms() {
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

      <h1>Terms of Service</h1>

      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        Welcome to Off Axis Deals (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using this website, 
        mobile app, or any related service (&quot;Platform&quot;), you agree to the following Terms of Service.
      </p>

      <h2>1. Use of Platform</h2>
      <p>
        You agree to use the Platform only for lawful purposes. You must not upload, post, or 
        transmit material that violates any law, infringes intellectual property, or disrupts 
        service integrity.
      </p>

      <h2>2. Accounts</h2>
      <p>
        You are responsible for safeguarding your account credentials and for all activity that 
        occurs under your account. We may suspend or terminate access for any misuse.
      </p>

      <h2>3. Content Ownership</h2>
      <p>
        All platform content, data, software, and materials are the property of Off Axis Deals. 
        You retain ownership of content you upload but grant us a non-exclusive license to display 
        and distribute it within the platform.
      </p>

      <h2>4. Payment and Subscriptions</h2>
      <p>
        Paid plans are billed through Stripe. Subscriptions renew automatically unless cancelled 
        before the next billing cycle. Refunds are provided only where required by law.
      </p>

      <h2>5. Limitation of Liability</h2>
      <p>
        Off Axis Deals provides the Platform &quot;as is.&quot; We make no warranties, express or implied. 
        In no event shall we be liable for any indirect, incidental, or consequential damages 
        arising from use of the Platform.
      </p>

      <h2>6. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless Off Axis Deals and its members from 
        any claims or damages arising from your use of the Platform.
      </p>

      <h2>7. Governing Law</h2>
      <p>
        These terms are governed by the laws of the State of Arizona. Any dispute will be resolved 
        exclusively in Arizona courts.
      </p>

      <h2>8. Updates</h2>
      <p>
        We may revise these Terms at any time. Continued use of the Platform after changes 
        constitutes acceptance of the new terms.
      </p>
    </div>
  );
}
