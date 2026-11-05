import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bar, Card, Segmented, StateView } from '../components';
import { api, computeStats, monthLabel, useAsync } from '../data';
import { colors, fonts, radius } from '../theme';

type Period = '3 months' | '6 months' | 'Year';
const CHART_H = 128;
const PERIOD_MONTHS: Record<Period, number> = { '3 months': 3, '6 months': 6, Year: 12 };

export function ReportsScreen({ top }: { top: number }) {
  const [period, setPeriod] = useState<Period>('6 months');
  const { data: books, error, loading, reload } = useAsync(() => api.allBooks(), []);
  const stats = useMemo(() => (books ? computeStats(books, PERIOD_MONTHS[period]) : null), [books, period]);

  const months = stats?.monthly ?? [];
  const monthMax = Math.max(1, ...months.map(m => m.collected));
  const barW = months.length > 6 ? 14 : 20;
  const subjects = stats?.by_subject ?? [];
  const subjTotal = subjects.reduce((n, x) => n + x.count, 0) || 1;
  const grades = stats?.by_grade ?? [];
  const gradeTotal = grades.reduce((n, x) => n + x.count, 0) || 1;
  const gradeMax = Math.max(1, ...grades.map(g => g.count));
  const subjColors = [colors.primary, '#7C93FF', colors.accentChart, colors.border];
  const subjColor = (i: number) => subjColors[Math.min(i, subjColors.length - 1)];

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: top + 16 }]}
      refreshControl={<RefreshControl refreshing={loading && !!books} onRefresh={reload} />}>
      <Text style={s.title}>Reports</Text>
      <Segmented options={['3 months', '6 months', 'Year'] as Period[]} value={period} onChange={setPeriod} />

      {!stats ? (
        <StateView loading={loading} error={error} onRetry={reload} />
      ) : stats.titles === 0 ? (
        <StateView empty="Reports will appear once books are added." />
      ) : (
        <>
          <Card style={s.panel}>
            <Text style={s.h2}>Books collected per month</Text>
            <View style={s.chart}>
              {months.map(m => (
                <View
                  key={m.month}
                  style={s.month}
                  accessibilityLabel={`${monthLabel(m.month)}: ${m.collected} collected`}>
                  <View style={s.bars}>
                    <View style={[s.bar, { width: barW, height: Math.max(2, (m.collected / monthMax) * CHART_H), backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={s.axis}>{monthLabel(m.month)}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={s.panel}>
            <Text style={s.h2}>By subject</Text>
            {/* Stacked bar stands in for the pie chart until a chart library (react-native-svg) is added. */}
            <View style={s.stack}>
              {subjects.map((x, i) => (
                <View key={x.label} style={{ flex: x.count, backgroundColor: subjColor(i) }} />
              ))}
            </View>
            {subjects.map((x, i) => (
              <View key={x.label} style={s.rowBetween}>
                <Legend color={subjColor(i)} label={x.label} />
                <Text style={s.pct}>{Math.round((x.count / subjTotal) * 100)}%</Text>
              </View>
            ))}
          </Card>

          <Card style={s.panel}>
            <Text style={s.h2}>By grade</Text>
            {grades.map(g => (
              <View key={g.label} style={{ gap: 4 }}>
                <View style={s.rowBetween}>
                  <Text style={s.legendText}>{g.label}</Text>
                  <Text style={s.pct}>{Math.round((g.count / gradeTotal) * 100)}%</Text>
                </View>
                <Bar pct={(g.count / gradeMax) * 100} height={6} />
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  title: { fontFamily: fonts.display, fontSize: 32, fontWeight: '600', color: colors.ink },
  panel: { padding: 16, gap: 12, borderRadius: radius.xl },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h2: { fontSize: 17, fontWeight: '600', color: colors.ink },
  chart: { flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: CHART_H + 22 },
  month: { flex: 1, alignItems: 'center', gap: 6 },
  bars: { flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: CHART_H },
  bar: { borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  axis: { fontSize: 10, color: colors.muted },
  stack: { height: 14, borderRadius: 7, flexDirection: 'row', overflow: 'hidden' },
  legendText: { fontSize: 13, color: colors.inkSoft },
  pct: { fontSize: 13, fontWeight: '600', color: colors.ink },
});
