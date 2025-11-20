export default function CRMExportPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#1a1a1a' }}>CRM Export (Coming Soon)</h1>
      
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '20px'
      }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#495057', marginBottom: '20px' }}>
          The CRM Export feature will allow you to export contact and lead data to popular CRM systems
          such as Salesforce, HubSpot, or custom CSV formats. This feature will include:
        </p>
        
        <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#495057', paddingLeft: '20px' }}>
          <li>Export contacts (investors, wholesalers) with full profile data</li>
          <li>Export lead data (messages, inquiries, watchlist activity)</li>
          <li>Export listing data with associated contacts</li>
          <li>Custom field mapping for different CRM systems</li>
          <li>Scheduled exports and API integration</li>
        </ul>
        
        <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '20px', fontStyle: 'italic' }}>
          This feature is currently under development and will be available in a future update.
        </p>
      </div>
    </div>
  );
}

