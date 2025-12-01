import HeatmapClient from './HeatmapClient';

export const dynamic = 'force-dynamic';

export default async function HeatmapPage() {

  // Fetch heatmap data from API (client-side will handle the fetch)
  return (
    <div
      style={{
        padding: "24px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{
          margin: "0 0 24px 0",
          fontSize: "24px",
          fontWeight: 600,
        }}
      >
        Investor Interest Heatmap
      </h2>
      <p
        style={{
          margin: "0 0 16px 0",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        This heatmap shows investor interest based on listing view counts. Higher view counts indicate stronger interest.
      </p>
      <HeatmapClient />
    </div>
  );
}
