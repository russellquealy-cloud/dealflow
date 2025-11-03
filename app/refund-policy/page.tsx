import React from "react";

export default function RefundPolicy() {
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

      <h1>Refund Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        Off Axis Deals (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) strives to deliver accurate, high-quality digital 
        services. Because access is instant and resources are consumed upon use, refunds are limited.
      </p>

      <h2>1. Subscriptions</h2>
      <p>
        All paid subscriptions renew automatically until cancelled. You may cancel anytime through 
        your account settings. Cancellation stops future billing but does not trigger retroactive 
        refunds for time already used.
      </p>

      <h2>2. Non-Refundable Items</h2>
      <p>
        Digital analyses, reports, or credits consumed within your billing cycle are non-refundable. 
        Promotional pricing and trial upgrades are also non-refundable.
      </p>

      <h2>3. Refund Exceptions</h2>
      <p>
        We consider refund requests only when:  
        (a) duplicate charges occurred due to system error, or  
        (b) you were billed after timely cancellation.  
        Requests must be sent to customerservice@offaxisdeals.com within 14 days of the charge.
      </p>

      <h2>4. Method of Refund</h2>
      <p>
        Approved refunds are processed through Stripe to your original payment method within 
        5–10 business days.
      </p>

      <h2>5. Contact</h2>
      <p>
        For billing questions or disputes, contact customerservice@offaxisdeals.com before 
        filing any external claim. We aim to resolve all issues directly and quickly.
      </p>
    </div>
  );
}

