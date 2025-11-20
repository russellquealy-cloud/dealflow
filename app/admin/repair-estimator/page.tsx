export default function RepairEstimatorPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#1a1a1a' }}>Repair Estimator (Coming Soon)</h1>
      
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '20px'
      }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#495057', marginBottom: '20px' }}>
          The Repair Estimator tool will allow wholesalers to quickly estimate repair costs for properties
          using AI-powered analysis. This tool will help wholesalers:
        </p>
        
        <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#495057', paddingLeft: '20px' }}>
          <li>Upload property photos or enter property details</li>
          <li>Get AI-generated repair estimates based on property condition</li>
          <li>View itemized repair costs (roof, HVAC, plumbing, electrical, etc.)</li>
          <li>Export repair estimates for use in deal analysis</li>
          <li>Track repair estimate accuracy over time</li>
        </ul>
        
        <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '20px', fontStyle: 'italic' }}>
          This feature is currently under development and will be available in a future update.
        </p>
      </div>
    </div>
  );
}

