// app/privacy/page.tsx
export default function PrivacyPage() {
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
            Privacy Policy
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
              1. Information We Collect
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include:
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Name and email address</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Property listings and related data</li>
              <li>Communication preferences</li>
            </ul>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              2. How We Use Your Information
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We use the information we collect to:
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              3. Information Sharing
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except:
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>To trusted service providers who assist us in operating our website</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              4. Data Security
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All payment information is processed securely through Stripe and is not stored on our servers.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              5. Cookies and Tracking
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We use cookies and similar tracking technologies to enhance your experience on our website. You can control cookie settings through your browser preferences.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              6. Your Rights
            </h2>
            <p style={{ marginBottom: '16px' }}>
              You have the right to:
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Opt out of marketing communications</li>
              <li>Data portability</li>
            </ul>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              7. Third-Party Services
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              8. Children&apos;s Privacy
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              9. Changes to This Policy
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
              10. Contact Us
            </h2>
            <p style={{ marginBottom: '16px' }}>
              If you have any questions about this privacy policy, please contact us at{' '}
              <a href="mailto:privacy@offaxisdeals.com" style={{ color: '#3b82f6' }}>
                privacy@offaxisdeals.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
