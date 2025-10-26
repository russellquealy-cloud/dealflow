import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '60px',
        maxWidth: '800px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            color: '#1a1a1a', 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Welcome to Off Axis Deals
          </h1>
          
          <div style={{
            width: '80px',
            height: '4px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            margin: '0 auto 32px',
            borderRadius: '2px'
          }} />
          
          <p style={{
            fontSize: '20px',
            lineHeight: '1.6',
            color: '#4a5568',
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}>
            Off Axis Deals is a real estate platform built for wholesalers and investors. 
            It connects verified off-market property deals directly with active buyers — 
            no middlemen, no wasted time. You can list, search, and close off-market deals 
            faster, with built-in tools for contact, images, and property details — 
            all streamlined for mobile and desktop.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '24px', 
          marginBottom: '40px' 
        }}>
          <div style={{
            padding: '24px',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            background: '#f8fafc'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏠</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>
              For Investors
            </h3>
            <p style={{ fontSize: '14px', color: '#718096', lineHeight: '1.5' }}>
              Find verified off-market deals, analyze properties with AI tools, 
              and connect directly with wholesalers.
            </p>
          </div>
          
          <div style={{
            padding: '24px',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            background: '#f8fafc'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>
              For Wholesalers
            </h3>
            <p style={{ fontSize: '14px', color: '#718096', lineHeight: '1.5' }}>
              List properties, get verified badges, access investor analytics, 
              and close deals faster with direct communication.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            href="/listings" 
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'transform 0.2s ease',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Browse Deals
          </Link>
          
          <Link 
            href="/pricing" 
            style={{
              background: 'white',
              color: '#667eea',
              padding: '16px 32px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              border: '2px solid #667eea',
              transition: 'all 0.2s ease',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#667eea';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#667eea';
            }}
          >
            View Pricing
          </Link>
        </div>

        <div style={{ 
          marginTop: '40px', 
          padding: '20px', 
          background: '#f7fafc', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#718096'
        }}>
          <p style={{ margin: '0' }}>
            Ready to streamline your real estate deals? 
            <Link href="/signup" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
              {' '}Get started today
            </Link>
            {' '}or{' '}
            <Link href="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
              sign in
            </Link>
            {' '}to your account.
          </p>
        </div>
      </div>
    </div>
  );
}
