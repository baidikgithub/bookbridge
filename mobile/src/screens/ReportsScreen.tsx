import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bar, LargeTitle, Section, Segmented, StateView, StatTile } from '../components';
import { api, monthLabel, useAsync } from '../data';
import { PieChart } from '../PieChart';
import { colors, space, type } from '../theme';

type Period = '3 Months' | '6 Months' | 'Year';
const CHART_H = 120;
const PERIOD_MONTHS: Record<Period, number> = { '3 Months': 3, '6 Months': 6, Year: 12 };
// Distinct iOS system hues; anything past the sixth subject is grouped as Other.
const SUBJECT_COLORS = [colors.primary, colors.accentChart, '#34C759', '#AF52DE', '#5AC8FA', '#FF2D55'];
const OTHER_COLOR = colors.faint;

export function ReportsScreen({ top }: { top: number }) {
  const [period, setPeriod] = useState<Period>('6 Months');
  const { data: stats, error, loading, reload } = useAsync(() => api.stats(PERIOD_MONTHS[period]), [period]);

  const months = stats?.monthly ?? [];
  const monthMax = Math.max(1, ...months.map(m => Math.max(m.collected, m.donated)));
  const barW = months.length > 6 ? 6 : 12;
  const collected = months.reduce((n, m) => n + m.collected, 0);
  const donated = months.reduce((n, m) => n + m.donated, 0);
  const allSubjects = stats?.by_subject ?? [];
  const subjects =
    allSubjects.length > SUBJECT_COLORS.length
      ? [
          ...allSubjects.slice(0, SUBJECT_COLORS.length - 1),
          { label: 'Other', count: allSubjects.slice(SUBJECT_COLORS.length - 1).reduce((n, x) => n + x.count, 0) },
        ]
      : allSubjects;
  const subjTotal = subjects.reduce((n, x) => n + x.count, 0) || 1;
  const grades = stats?.by_grade ?? [];
  const gradeMax = Math.max(1, ...grades.map(g => g.count));
  const subjColor = (i: number) => (subjects[i]?.label === 'Other' ? OTHER_COLOR : SUBJECT_COLORS[i]);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: top }]}
      refreshControl={<RefreshControl refreshing={loading && !!stats} onRefresh={reload} />}>
      <LargeTitle title="Reports" />
      <View style={s.body}>
        <Segmented options={['3 Months', '6 Months', 'Year'] as Period[]} value={period} onChange={setPeriod} />

        {!stats ? (
          <StateView loading={loading} error={error} onRetry={reload} />
        ) : stats.titles === 0 ? (
          <StateView empty="Reports will appear once books are added." />
        ) : (
          <>
            <View style={s.tiles}>
              <StatTile label="Collected" value={collected} />
              <StatTile label="Donated" value={donated} tint={colors.accent} />
              <StatTile label="In stock" value={stats.available} />
            </View>

            <Section header="Per month">
              <View style={s.panel}>
                <View style={s.legendRow}>
                  <Legend color={colors.primary} label="Collected" />
                  <Legend color={colors.accentChart} label="Donated" />
                </View>
                <View style={s.chart}>
                  {months.map(m => (
                    <View key={m.month} style={s.month} accessibilityLabel={`${monthLabel(m.month)}: ${m.collected} collected, ${m.donated} donated`}>
                      <View style={s.bars}>
                        <View style={[s.bar, { width: barW, height: Math.max(2, (m.collected / monthMax) * CHART_H), backgroundColor: colors.primary }]} />
                        <View style={[s.bar, { width: barW, height: Math.max(2, (m.donated / monthMax) * CHART_H), backgroundColor: colors.accentChart }]} />
                      </View>
                      <Text style={type.caption}>{monthLabel(m.month)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Section>

            <Section header="By subject" footer="Share of all copies collected.">
              <View style={[s.panel, s.pieRow]}>
                <PieChart data={subjects.map((x, i) => ({ label: x.label, value: x.count, color: subjColor(i) }))} background={colors.surface} />
                <View style={s.pieLegend}>
                  {subjects.map((x, i) => (
                    <View key={x.label} style={s.rowBetween}>
                      <Legend color={subjColor(i)} label={x.label} />
                      <Text style={s.pct}>{Math.round((x.count / subjTotal) * 100)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Section>

            <Section header="By grade" footer="Books covering several grades count in each band.">
              <View style={s.panel}>
                {grades.map(g => (
                  <View key={g.label} style={s.gradeRow}>
                    <Text style={[type.subhead, { width: 48 }]}>{g.label}</Text>
                    <Bar pct={(g.count / gradeMax) * 100} />
                    <Text style={[s.pct, { width: 40 }]}>{g.count}</Text>
                  </View>
                ))}
              </View>
            </Section>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.legend}>
      <View style={[s.swatch, { backgroundColor: color }]} />
      <Text style={type.subhead} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xl },
  body: { paddingHorizontal: space.gutter, paddingTop: space.sm, gap: space.xl },
  tiles: { flexDirection: 'row', gap: space.sm, marginTop: -space.sm },
  panel: { padding: space.lg, gap: space.md },
  legendRow: { flexDirection: 'row', gap: space.lg },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chart: { flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: CHART_H + 20 },
  month: { flex: 1, alignItems: 'center', gap: 4 },
  bars: { flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: CHART_H },
  bar: { borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  pieLegend: { flex: 1, gap: space.sm },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pct: { fontSize: 15, fontWeight: '600', color: colors.ink, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
