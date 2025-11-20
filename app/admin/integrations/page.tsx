export default function IntegrationsPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#1a1a1a' }}>Custom Integrations (Coming Soon)</h1>
      
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '20px'
      }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#495057', marginBottom: '20px' }}>
          Custom Integrations will provide tools to connect Off Axis Deals with external services and
          platforms. Planned integrations include:
        </p>
        
        <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#495057', paddingLeft: '20px' }}>
          <li>Zapier integration for workflow automation</li>
          <li>Webhook endpoints for real-time event notifications</li>
          <li>REST API for programmatic access</li>
          <li>CRM integrations (Salesforce, HubSpot, etc.)</li>
          <li>Email marketing platform integrations</li>
        </ul>
        
        <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '20px', fontStyle: 'italic' }}>
          This feature is currently under development and will be available in a future update.
        </p>
      </div>
    </div>
  );
}

