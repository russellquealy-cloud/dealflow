'use client';

import * as React from 'react';

import type {
  CoreStats,
  InvestorStats,
  TrendStat,
  UserAnalytics,
  WholesalerStats,
} from '@/lib/analytics';

type UserAnalyticsProps = {
  stats: UserAnalytics;
  isPro: boolean;
};

type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  subLabel?: React.ReactNode;
  accent?: string;
  children?: React.ReactNode;
  grow?: boolean;
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
  gap: '16px',
};

const advancedGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '14px',
};

const cardBaseStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '14px',
  padding: '18px',
  border: '1px solid rgba(148, 163, 184, 0.28)',
  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '96px',
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const metricValueRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginTop: '8px',
};

const metricValueStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 700,
  color: '#0f172a',
};

const trendChipStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: 9999,
  padding: '4px 8px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};

const mutedTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#94a3b8',
};

function formatNumber(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toLocaleString();
}

function formatPercent(value: number, opts: { fractionDigits?: number } = {}): string {
  const digits = opts.fractionDigits ?? 1;
  return `${(value * 100).toFixed(digits)}%`;
}

function trendDelta(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 1 : 0;
  }
  return (current - previous) / Math.abs(previous);
}

function TrendPill({ trend }: { trend: TrendStat }) {
  const delta = trendDelta(trend.current, trend.previous);
  let color = '#94a3b8';
  let glyph = '→';
  if (delta > 0.01) {
    color = '#16a34a';
    glyph = '↑';
  } else if (delta < -0.01) {
    color = '#dc2626';
    glyph = '↓';
  }
  const percentDisplay = `${Math.abs(delta * 100).toFixed(1)}%`;
  return (
    <span style={{ ...trendChipStyle, background: `${color}1A`, color }}>
      {glyph} {percentDisplay}
    </span>
  );
}

function MetricCard({ title, value, subLabel, accent, children, grow }: MetricCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const style: React.CSSProperties = {
    ...cardBaseStyle,
    boxShadow: hovered
      ? '0 16px 32px rgba(15, 23, 42, 0.18)'
      : cardBaseStyle.boxShadow,
    transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
    borderColor: accent ? `${accent}66` : cardBaseStyle.border as string,
    flexGrow: grow ? 1 : undefined,
  };

  return (
    <div
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div>
        <div style={{ ...metricLabelStyle, color: accent ?? metricLabelStyle.color }}>
          {title}
        </div>
        <div style={metricValueRowStyle}>
          <div style={{ ...metricValueStyle, color: accent ? '#0f172a' : metricValueStyle.color }}>
            {value}
          </div>
          {subLabel}
        </div>
      </div>
      {children ? <div style={{ marginTop: '12px' }}>{children}</div> : null}
    </div>
  );
}

function renderCoreMetrics(stats: CoreStats): React.ReactNode {
  const metrics = [
    { label: 'Saved Deals', value: stats.savedListings, accent: '#1d4ed8' },
    { label: 'Contacts Made', value: stats.contactsMade, accent: '#0ea5e9' },
    { label: 'AI Analyses', value: stats.aiAnalyses, accent: '#22c55e' },
    { label: 'Watchlists', value: stats.watchlists, accent: '#f97316' },
  ];

  return metrics.map((metric) => (
    <MetricCard
      key={metric.label}
      title={metric.label}
      value={formatNumber(metric.value)}
      accent={metric.accent}
    />
  ));
}

function renderHotMarkets(markets: { label: string; value: number }[]) {
  if (!markets.length) {
    return <div style={mutedTextStyle}>Add more saved deals to surface hot markets.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {markets.map((market) => (
        <div
          key={market.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: '#f8fafc',
            borderRadius: 9999,
            padding: '6px 12px',
            fontSize: 13,
            color: '#1f2937',
            fontWeight: 600,
          }}
        >
          <span>{market.label}</span>
          <span>{market.value}</span>
        </div>
      ))}
    </div>
  );
}

function renderInvestorSection(stats: InvestorStats) {
  const activityTone =
    stats.activityScore >= 70 ? '#16a34a' : stats.activityScore >= 40 ? '#0ea5e9' : '#f97316';

  return (
    <div style={gridStyle}>
      <MetricCard
        title="Deals Viewed (30 days)"
        value={formatNumber(stats.dealsViewed.current)}
        subLabel={<TrendPill trend={stats.dealsViewed} />}
      >
        <div style={mutedTextStyle}>Compared to previous 30 days</div>
      </MetricCard>

      <MetricCard title="Hot Markets" value="" grow>
        {renderHotMarkets(stats.hotMarkets)}
      </MetricCard>

      <MetricCard
        title="Estimated ROI on Saved Deals"
        value={
          stats.roiEstimate != null
            ? formatPercent(stats.roiEstimate, { fractionDigits: 1 })
            : '—'
        }
      >
        {stats.roiEstimate != null ? (
          <div style={mutedTextStyle}>Based on recent analyzer runs</div>
        ) : (
          <div style={mutedTextStyle}>
            Add more analyzed deals to unlock ROI insights.
          </div>
        )}
      </MetricCard>

      <MetricCard
        title="Activity Score"
        value={stats.activityScore.toString()}
        accent={activityTone}
      >
        <div style={mutedTextStyle}>
          Score combines saved deals, contacts, watchlists, and analyses.
        </div>
      </MetricCard>
    </div>
  );
}

function renderListingBreakdown(breakdown: WholesalerStats['listingStatusBreakdown']) {
  const total = breakdown.total || 1;
  const activePercent = breakdown.active / total;
  const soldPercent = breakdown.sold / total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div
          style={{
            flex: 1,
            height: 6,
            background: '#e2e8f0',
            borderRadius: 9999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(activePercent * 100, 100)}%`,
              background: '#0ea5e9',
              borderRadius: 9999,
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {breakdown.active} active / {breakdown.total}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#64748b' }}>
        {breakdown.sold} marked as sold
      </div>
    </div>
  );
}

function renderConversionBar(value: number | null) {
  if (value == null) {
    return <div style={mutedTextStyle}>Not enough data yet.</div>;
  }
  const percent = Math.min(1, Math.max(0, value));
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
        {formatPercent(percent, { fractionDigits: 1 })}
      </div>
      <div
        style={{
          height: 8,
          background: '#e2e8f0',
          borderRadius: 9999,
          marginTop: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent * 100}%`,
            background: '#10b981',
            borderRadius: 9999,
          }}
        />
      </div>
    </div>
  );
}

function renderWholesalerSection(stats: WholesalerStats) {
  const responseLabel =
    stats.avgResponseTimeHours == null
      ? 'No response data'
      : stats.avgResponseTimeHours <= 2
      ? 'Fast'
      : stats.avgResponseTimeHours <= 6
      ? 'Normal'
      : 'Slow';
  const responseColor =
    responseLabel === 'Fast'
      ? '#16a34a'
      : responseLabel === 'Normal'
      ? '#0ea5e9'
      : '#f97316';

  return (
    <div style={gridStyle}>
      <MetricCard
        title="Listings Performance"
        value={`${formatNumber(stats.listingStatusBreakdown.total)}`}
        subLabel={<TrendPill trend={stats.listingsPosted} />}
      >
        {renderListingBreakdown(stats.listingStatusBreakdown)}
      </MetricCard>

      <MetricCard
        title="Leads Generated"
        value={formatNumber(stats.leadsGenerated.current)}
        subLabel={<TrendPill trend={stats.leadsGenerated} />}
      >
        <div style={mutedTextStyle}>Distinct investors contacting you.</div>
      </MetricCard>

      <MetricCard
        title="Avg Response Time"
        value={
          stats.avgResponseTimeHours != null
            ? `${stats.avgResponseTimeHours.toFixed(1)}h`
            : '—'
        }
        accent={responseColor}
      >
        <div style={mutedTextStyle}>{responseLabel}</div>
      </MetricCard>

      <MetricCard title="Conversion Rate" value="" grow>
        {renderConversionBar(stats.conversionRate ?? null)}
      </MetricCard>
    </div>
  );
}

function renderAdvancedSection(isPro: boolean) {
  const cards = [
    {
      title: 'Lead Conversion Trends',
      body: 'Track the funnel from inquiry to closed deal with cohort analysis.',
    },
    {
      title: 'Geographic Heatmap',
      body: 'Visualize buyer interest across your target metros to source smarter.',
    },
    {
      title: 'CSV & API Export',
      body: 'Sync analytics with your CRM or download data snapshots anytime.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          Advanced Analytics {isPro ? '' : '(Preview)'}
        </h3>
        {!isPro && (
          <span
            style={{
              fontSize: 12,
              color: '#1d4ed8',
              background: '#dbeafe',
              borderRadius: 9999,
              padding: '4px 10px',
              fontWeight: 600,
            }}
          >
            Upgrade to Pro for full insights
          </span>
        )}
      </div>
      <div style={advancedGridStyle}>
        {cards.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={isPro ? 'Available' : 'Locked'}
            subLabel={
              isPro ? (
                <span style={{ ...trendChipStyle, background: '#22c55e1A', color: '#22c55e' }}>
                  Pro
                </span>
              ) : (
                <span style={{ ...trendChipStyle, background: '#cbd5f533', color: '#64748b' }}>
                  Pro Feature
                </span>
              )
            }
            accent={isPro ? '#22c55e' : undefined}
          >
            <div style={{ color: isPro ? '#475569' : '#94a3b8', fontSize: 13 }}>{card.body}</div>
          </MetricCard>
        ))}
      </div>
    </div>
  );
}

export default function UserAnalyticsDashboard({ stats, isPro }: UserAnalyticsProps) {
  return (
    <section style={containerStyle}>
      <div>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f172a' }}>Analytics</h2>
        <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>
          Snapshot of your recent performance and engagement.
        </p>
      </div>

      <div style={gridStyle}>{renderCoreMetrics(stats)}</div>

      {stats.role === 'investor'
        ? renderInvestorSection(stats as InvestorStats)
        : renderWholesalerSection(stats as WholesalerStats)}

      {renderAdvancedSection(isPro)}
    </section>
  );
}


