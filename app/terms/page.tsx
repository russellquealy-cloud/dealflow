// app/terms/page.tsx
export default function TermsPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1a1a1a',
            marginBottom: '24px'
          }}>
            Terms of Service
          </h1>
          
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280',
            marginBottom: '32px'
          }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ marginBottom: '16px' }}>
              By accessing and using Off Axis Deals (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              2. Use License
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Permission is granted to temporarily download one copy of the materials on Off Axis Deals for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>modify or copy the materials</li>
              <li>use the materials for any commercial purpose or for any public display</li>
              <li>attempt to reverse engineer any software contained on the website</li>
              <li>remove any copyright or other proprietary notations from the materials</li>
            </ul>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              3. User Accounts
            </h2>
            <p style={{ marginBottom: '16px' }}>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              4. Prohibited Uses
            </h2>
            <p style={{ marginBottom: '16px' }}>
              You may not use our service:
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
            </ul>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              5. Content
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the service, including its legality, reliability, and appropriateness.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              6. Payment Terms
            </h2>
            <p style={{ marginBottom: '16px' }}>
              If you purchase a subscription, you agree to pay all charges at the prices then in effect for your purchases. You are responsible for providing current, complete and accurate purchase and account information for all purchases made via the service.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              7. Termination
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              8. Disclaimer
            </h2>
            <p style={{ marginBottom: '16px' }}>
              The information on this service is provided on an &quot;as is&quot; basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions and terms relating to our service and the use of this service.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              9. Governing Law
            </h2>
            <p style={{ marginBottom: '16px' }}>
              These Terms shall be interpreted and governed by the laws of the United States. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              10. Contact Information
            </h2>
            <p style={{ marginBottom: '16px' }}>
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@offaxisdeals.com" style={{ color: '#3b82f6' }}>
                legal@offaxisdeals.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
