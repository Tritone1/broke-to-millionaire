import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { COMPANY_TYPES, companyTypeById } from '../data/companyTypes';
import { formatBig, toNumber } from '../game/BigNumber';
import { BUSINESS_UNLOCK_NET_WORTH } from '../game/config';
import { calculateLifeNetWorth, companyHiringCost, companyProfitPerSecond, companyUpgradeCost, companyValuation, hasBusinessAccess, useLifeStore, type CompanyUpgrades } from '../store/lifeStore';
import { colors } from '../theme';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { LifeHeader } from '../components/LifeHeader';
import { ProgressBar } from '../components/ProgressBar';
import { Screen } from '../components/Screen';
import { SceneStage } from '../components/scene/SceneStage';
import { ActionDock } from '../components/scene/ActionDock';
import { RequirementGate } from '../components/RequirementGate';

const UPGRADE_LABELS: Record<keyof CompanyUpgrades, string> = { marketing: '📣 Marketing', equipment: '⚙️ Equipment', location: '📍 Location' };

export function CompanyScreen() {
  const state = useLifeStore(useShallow((current) => ({
    companies: current.companies,
    legacyPoints: current.legacyPoints,
    monthLengthSeconds: current.monthLengthSeconds,
    businessAccess: hasBusinessAccess(current),
    netWorth: toNumber(calculateLifeNetWorth(current)),
    foundCompany: current.foundCompany,
    sellCompany: current.sellCompany,
    hireEmployee: current.hireEmployee,
    fireEmployee: current.fireEmployee,
    boostCompany: current.boostCompany,
    hireManager: current.hireManager,
    upgradeCompany: current.upgradeCompany,
    ipoCompany: current.ipoCompany,
  })));
  const [typeId, setTypeId] = useState(COMPANY_TYPES[0]!.id);
  const [name, setName] = useState('');
  const selectedType = companyTypeById(typeId);
  const netWorth = state.netWorth;
  const create = () => {
    if (state.foundCompany(typeId, name || `My ${selectedType.name}`)) setName('');
  };
  const confirmSell = (companyId: string, companyName: string) => Alert.alert('Sell company?', `${companyName} will be sold for 75% of its valuation.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sell', style: 'destructive', onPress: () => state.sellCompany(companyId) },
  ]);
  if (!state.businessAccess) {
    return (
      <Screen>
        <LifeHeader />
        <SceneStage location="office" pose="idle" compact />
        <View style={styles.locked}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockBadge}>UNLOCK AT $50K NET WORTH</Text>
          <Text style={styles.lockTitle}>Build capital before becoming a founder</Text>
          <Text style={styles.lockBody}>Reach the threshold through work, education, and careful saving before opening your first company.</Text>
          <Text style={styles.lockProgress}>${formatBig(netWorth, 2)} / ${formatBig(BUSINESS_UNLOCK_NET_WORTH)}</Text>
        </View>
        <ActionDock active="business" />
      </Screen>
    );
  }
  return (
    <Screen>
      <LifeHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SceneStage location="office" pose="talk" compact />
        <Text style={styles.eyebrow}>FOUNDER MODE</Text>
        <Text style={styles.title}>Your Companies</Text>

        <Card style={styles.founder}>
          <Text style={styles.cardHeading}>Found a company</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
            {COMPANY_TYPES.map((type) => (
              <AppButton key={type.id} variant={type.id === typeId ? 'gold' : 'ghost'} onPress={() => setTypeId(type.id)} style={styles.typeButton}>{type.emoji} {type.name}</AppButton>
            ))}
          </ScrollView>
          <TextInput value={name} onChangeText={setName} placeholder={`Name your ${selectedType.name}`} placeholderTextColor={colors.muted} maxLength={24} style={styles.input} />
          <View style={styles.founderMeta}>
            <Text style={styles.meta}>Startup ${formatBig(selectedType.startupCost)}</Text>
            <Text style={styles.profit}>Base ${formatBig(selectedType.baseRevenuePerSecond * state.monthLengthSeconds, 2)}/month</Text>
          </View>
          <RequirementGate requirements={[{ kind: 'fee', amount: selectedType.startupCost, label: 'Startup capital' }, { kind: 'energy', amount: 10 }, { kind: 'reputation', amount: Math.max(0, COMPANY_TYPES.findIndex((item) => item.id === selectedType.id) * 2) }]} label="CHECK & FOUND COMPANY" onAllowed={create} />
        </Card>

        <Text style={styles.section}>PORTFOLIO • {state.companies.length} COMPANIES</Text>
        {state.companies.length === 0 ? (
          <Card><Text style={styles.empty}>Your first company is the bridge from employee to entrepreneur.</Text></Card>
        ) : null}
        {state.companies.map((company) => {
          const definition = companyTypeById(company.typeId);
          const profit = companyProfitPerSecond(company, state.legacyPoints);
          return (
            <Card key={company.id} style={styles.company}>
              <View style={styles.header}>
                <Text style={styles.companyEmoji}>{definition.emoji}</Text>
                <View style={styles.flex}>
                  <Text style={styles.companyName}>{company.name}</Text>
                  <Text style={styles.companyType}>{definition.name} • Level {company.level}{company.isPublic ? ' • PUBLIC' : ''}</Text>
                </View>
                <Text style={styles.companyProfit}>${formatBig(profit * state.monthLengthSeconds, 2)}/month</Text>
              </View>
              <View style={styles.reputationRow}><Text style={styles.smallLabel}>REPUTATION</Text><Text style={styles.smallValue}>{Math.round(company.reputation)}%</Text></View>
              <ProgressBar progress={company.reputation / 100} color={colors.gold} />
              <View style={styles.metrics}>
                <View style={styles.metric}><Text style={styles.metricValue}>{company.employees.length}</Text><Text style={styles.metricLabel}>Employees</Text></View>
                <View style={styles.metric}><Text style={styles.metricValue}>${formatBig(profit * state.monthLengthSeconds)}</Text><Text style={styles.metricLabel}>Monthly profit</Text></View>
                <View style={styles.metric}><Text style={styles.metricValue}>${formatBig(companyValuation(company))}</Text><Text style={styles.metricLabel}>Valuation</Text></View>
              </View>
              {company.employees.length > 0 ? (
                <View style={styles.employees}>
                  {company.employees.slice(0, 4).map((employee) => <Text key={employee.id} style={styles.employee}>👤 {employee.name} • {employee.productivity}% • -${formatBig(employee.salaryPerSecond * state.monthLengthSeconds, 2)}/month</Text>)}
                  {company.employees.length > 4 ? <Text style={styles.moreEmployees}>+{company.employees.length - 4} more employees</Text> : null}
                </View>
              ) : null}
              <View style={styles.actionRow}>
                <AppButton variant="green" onPress={() => state.hireEmployee(company.id)} style={styles.half}>HIRE · ${formatBig(companyHiringCost(company))}</AppButton>
                <AppButton variant="ghost" disabled={company.employees.length === 0} onPress={() => state.fireEmployee(company.id)} style={styles.half}>FIRE LAST</AppButton>
              </View>
              <View style={styles.actionRow}>
                <AppButton onPress={() => state.boostCompany(company.id)} style={styles.half}>RUN · 8 ENERGY · 1.5×</AppButton>
                <AppButton variant="ghost" disabled={company.manager} onPress={() => state.hireManager(company.id)} style={styles.half}>{company.manager ? '✓ MANAGED' : `MANAGER • $${formatBig(definition.startupCost * 1.5)}`}</AppButton>
              </View>
              <Text style={styles.upgradeTitle}>UPGRADES</Text>
              {(Object.keys(UPGRADE_LABELS) as (keyof CompanyUpgrades)[]).map((kind) => {
                const cost = companyUpgradeCost(company, kind);
                return (
                  <AppButton key={kind} variant="ghost" onPress={() => state.upgradeCompany(company.id, kind)} style={styles.upgrade}>
                    <View style={styles.upgradeRow}>
                      <Text numberOfLines={1} style={styles.upgradeName}>{UPGRADE_LABELS[kind]}</Text>
                      <Text style={styles.upgradeLevel}>Lv {company.upgrades[kind]}</Text>
                      <Text numberOfLines={1} style={styles.upgradePrice}>${formatBig(cost)}</Text>
                    </View>
                  </AppButton>
                );
              })}
              <View style={styles.actionRow}>
                <AppButton variant="ghost" disabled={company.isPublic || company.level < 5 || company.reputation < 60} onPress={() => state.ipoCompany(company.id)} style={styles.half}>{company.isPublic ? 'PUBLIC COMPANY' : 'LAUNCH IPO'}</AppButton>
                <AppButton variant="danger" onPress={() => confirmSell(company.id, company.name)} style={styles.half}>SELL</AppButton>
              </View>
            </Card>
          );
        })}
      </ScrollView>
      <ActionDock active="business" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFF8E8' },
  lockIcon: { fontSize: 42 },
  lockBadge: { color: '#6F4A00', backgroundColor: '#FFD95C', borderRadius: 12, overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 6, fontSize: 9, fontWeight: '900', marginTop: 8 },
  lockTitle: { color: colors.text, fontSize: 22, lineHeight: 26, fontWeight: '900', textAlign: 'center', marginTop: 13 },
  lockBody: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  lockProgress: { color: colors.greenDark, fontSize: 18, fontWeight: '900', marginTop: 14 },
  content: { padding: 16, paddingBottom: 110 },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginBottom: 13 },
  founder: { borderColor: colors.goldDark },
  cardHeading: { color: colors.text, fontSize: 18, fontWeight: '900' },
  typeRow: { gap: 7, paddingVertical: 11 },
  typeButton: { minHeight: 38, paddingVertical: 7 },
  input: { minHeight: 48, backgroundColor: colors.surface2, borderRadius: 13, color: colors.text, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 13 },
  founderMeta: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 9 },
  meta: { color: colors.gold, fontSize: 11, fontWeight: '800' },
  profit: { color: colors.green, fontSize: 11, fontWeight: '800' },
  section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 23, marginBottom: 9 },
  empty: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
  company: { marginBottom: 13 },
  header: { flexDirection: 'row', alignItems: 'center' },
  companyEmoji: { fontSize: 36, marginRight: 11 },
  flex: { flex: 1 },
  companyName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  companyType: { color: colors.muted, fontSize: 10, marginTop: 2 },
  companyProfit: { color: colors.green, fontWeight: '900' },
  reputationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13, marginBottom: 5 },
  smallLabel: { color: colors.muted, fontSize: 8, fontWeight: '900' },
  smallValue: { color: colors.gold, fontSize: 9, fontWeight: '900' },
  metrics: { flexDirection: 'row', marginTop: 13, gap: 6 },
  metric: { flex: 1, backgroundColor: colors.surface2, borderRadius: 11, padding: 8, alignItems: 'center' },
  metricValue: { color: colors.text, fontSize: 12, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 8, marginTop: 2 },
  employees: { marginTop: 10, padding: 9, backgroundColor: '#0C120E', borderRadius: 10 },
  employee: { color: colors.muted, fontSize: 10, marginVertical: 2 },
  moreEmployees: { color: colors.gold, fontSize: 10, marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: 7, marginTop: 8 },
  half: { flex: 1, minHeight: 40, paddingHorizontal: 5 },
  upgradeTitle: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 13 },
  upgrade: { marginTop: 6, minHeight: 39, paddingHorizontal: 12 },
  upgradeRow: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  upgradeName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '900' },
  upgradeLevel: { color: colors.muted, fontSize: 11, fontWeight: '800', marginHorizontal: 8 },
  upgradePrice: { color: colors.goldDark, fontSize: 13, fontWeight: '900' },
});
