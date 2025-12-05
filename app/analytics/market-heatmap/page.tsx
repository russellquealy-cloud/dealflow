import MarketSnapshotsMap from '@/components/MarketSnapshotsMap';

export const dynamic = 'force-dynamic';

export default async function MarketHeatmapPage() {
  return (
    <div
      style={{
        padding: '24px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <h2
        style={{
          margin: '0 0 24px 0',
          fontSize: '24px',
          fontWeight: 600,
        }}
      >
        Market Temperature Heatmap
      </h2>
      <p
        style={{
          margin: '0 0 16px 0',
          color: '#6b7280',
          fontSize: '14px',
        }}
      >
        This heatmap shows market temperature across major metros based on the Market Temp Index. 
        Cooler markets (blue) indicate lower activity, while hotter markets (red) indicate higher activity.
      </p>
      <MarketSnapshotsMap />
    </div>
  );
}

