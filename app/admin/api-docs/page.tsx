export default function APIDocsPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#1a1a1a' }}>API Documentation (Coming Soon)</h1>
      
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '20px'
      }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#495057', marginBottom: '20px' }}>
          The API Documentation will provide comprehensive documentation for the Off Axis Deals REST API,
          including authentication, endpoints, request/response formats, and code examples.
        </p>
        
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#1a1a1a' }}>Planned API Features</h2>
          <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#495057', paddingLeft: '20px' }}>
            <li>RESTful API endpoints for listings, users, messages, and analytics</li>
            <li>OAuth 2.0 authentication and API key management</li>
            <li>Rate limiting and usage tracking</li>
            <li>Webhook subscriptions for real-time events</li>
            <li>OpenAPI/Swagger documentation</li>
            <li>Code examples in multiple languages (JavaScript, Python, etc.)</li>
          </ul>
        </div>
        
        <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '20px', fontStyle: 'italic' }}>
          API documentation is currently under development and will be available in a future update.
        </p>
      </div>
    </div>
  );
}

