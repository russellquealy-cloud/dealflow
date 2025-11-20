export default function TeamPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#1a1a1a' }}>Team Seats (Coming Soon)</h1>
      
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '20px'
      }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#495057', marginBottom: '20px' }}>
          Team Seats will allow organizations to manage multi-user subscriptions and team member access.
          This feature will include:
        </p>
        
        <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#495057', paddingLeft: '20px' }}>
          <li>Add and remove team members</li>
          <li>Assign roles and permissions to team members</li>
          <li>Manage team subscription and billing</li>
          <li>Track team usage and activity</li>
          <li>Centralized team dashboard and reporting</li>
        </ul>
        
        <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '20px', fontStyle: 'italic' }}>
          This feature is currently under development and will be available in a future update.
        </p>
      </div>
    </div>
  );
}

