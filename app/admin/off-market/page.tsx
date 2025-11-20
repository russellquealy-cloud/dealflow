export default function OffMarketPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#1a1a1a' }}>Off-Market Feed (Coming Soon)</h1>
      
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '20px'
      }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#495057', marginBottom: '20px' }}>
          The Off-Market Feed will provide access to exclusive off-market property listings and data feeds
          from various sources. This feature will include:
        </p>
        
        <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#495057', paddingLeft: '20px' }}>
          <li>Integration with off-market listing providers</li>
          <li>Automated feed ingestion and property matching</li>
          <li>Filtering and search capabilities for off-market properties</li>
          <li>Lead generation from off-market opportunities</li>
          <li>Data quality monitoring and deduplication</li>
        </ul>
        
        <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '20px', fontStyle: 'italic' }}>
          This feature is currently under development and will be available in a future update.
        </p>
      </div>
    </div>
  );
}

