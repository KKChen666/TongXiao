import { useMemo } from 'react';
import { Card, CardContent, Chip, Tooltip } from '@heroui/react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine, Bar, Legend
} from 'recharts';
import { ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const INTERVALS = [0, 1, 2, 4, 7, 15, 30];
const DAY_LABELS = ['学习', '1天', '2天', '4天', '7天', '15天', '30天'];

// Move CustomTooltip outside component to avoid re-creation on every render
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold mb-1">第 {label} 天</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-medium">{p.value}{p.name.includes('记忆') ? '%' : ' 张'}</span>
        </div>
      ))}
    </div>
  );
};

function EbbinghausChart({ retentionStats }) {
  const curveData = useMemo(() => {
    const data = [];
    for (let d = 0; d <= 30; d += 0.2) {
      data.push({
        day: +d.toFixed(1),
        natural: +(100 * Math.exp(-0.18 * d)).toFixed(1),
        reviewed: +(Math.max(60, 100 * Math.exp(-0.06 * d))).toFixed(1),
      });
    }
    return data;
  }, []);

  const userData = useMemo(() => {
    if (!retentionStats?.retentionCurve) return [];
    return retentionStats.retentionCurve.filter(r => r.retention !== null).map(r => ({
      day: r.day,
      retention: r.retention,
      count: r.cardCount,
      forget: r.predictedForget,
    }));
  }, [retentionStats]);

  const totalForget = retentionStats?.totalPredictedForget || 0;
  const totalCards = retentionStats?.totalCards || 0;
  const avgRetention = totalCards > 0 && userData.length > 0
    ? Math.round(userData.reduce((s, r) => s + r.retention, 0) / userData.length)
    : null;

  return (
    <div className="space-y-3">
      {totalCards > 0 && (
        <Card className="bg-gradient-to-r from-primary-50 to-secondary-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-sm">记忆预测</h3>
                <p className="text-xs text-default-500 mt-0.5">基于你的复习数据推算</p>
              </div>
              <div className="flex items-center gap-3">
                {avgRetention !== null && (
                  <Chip
                    color={avgRetention >= 80 ? 'success' : avgRetention >= 60 ? 'warning' : 'danger'}
                    variant="secondary"
                    size="sm"
                  >
                    平均记忆率 {avgRetention}%
                  </Chip>
                )}
                {totalForget > 0 && (
                  <Chip
                    color="warning"
                    variant="secondary"
                    size="sm"
                  >
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1" />
                    预计遗忘 {totalForget} 张
                  </Chip>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-1">
            <ChartBarIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">艾宾浩斯遗忘曲线</h3>
          </div>
          <p className="text-xs text-default-400 mb-4">
            虚线 = 理论曲线 · 实线 = 按时复习效果 · 柱形 = 你各阶段记忆率
          </p>

          <div className="w-full" style={{ minHeight: 280, height: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart
                data={curveData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="day"
                  ticks={INTERVALS}
                  tickFormatter={v => DAY_LABELS[INTERVALS.indexOf(v)] || ''}
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="natural"
                  name="自然遗忘"
                  stroke="#F31260"
                  strokeDasharray="5 5"
                  fill="url(#naturalGrad)"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="reviewed"
                  name="复习后记忆"
                  stroke="#006FEE"
                  fill="url(#reviewedGrad)"
                  strokeWidth={2}
                  dot={false}
                />

                {INTERVALS.slice(1).map(d => (
                  <ReferenceLine
                    key={d}
                    x={d}
                    stroke="#F5A524"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    strokeOpacity={0.5}
                    label={{
                      value: '复习',
                      position: 'top',
                      fontSize: 9,
                      fill: '#F5A524',
                    }}
                  />
                ))}

                {userData.map((r, i) => (
                  <Bar
                    key={r.day}
                    data={[{ day: r.day, userRetention: r.retention }]}
                    dataKey="userRetention"
                    name="你的记忆率"
                    fill="#17C964"
                    fillOpacity={0.6}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                    label={{
                      position: 'top',
                      fontSize: 10,
                      fill: '#17C964',
                      fontWeight: 600,
                      formatter: v => `${v}%`,
                    }}
                  />
                ))}

                <defs>
                  <linearGradient id="naturalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F31260" stopOpacity={0.06} />
                    <stop offset="95%" stopColor="#F31260" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="reviewedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006FEE" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#006FEE" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-4 mt-3 justify-center text-[11px]">
            <span className="flex items-center gap-1.5 text-default-500">
              <span className="w-4 h-0.5 bg-danger inline-block" style={{ borderTop: '1.5px dashed #F31260' }} />
              自然遗忘
            </span>
            <span className="flex items-center gap-1.5 text-default-500">
              <span className="w-3 h-0.5 bg-primary inline-block" />
              复习保持
            </span>
            {userData.length > 0 && (
              <span className="flex items-center gap-1.5 text-default-500">
                <span className="w-2.5 h-2.5 bg-success/60 rounded inline-block" />
                你的记忆率
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EbbinghausChart;
