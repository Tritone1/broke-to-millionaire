import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { LifeHeader } from '../components/LifeHeader';
import { ProgressBar } from '../components/ProgressBar';
import { Screen } from '../components/Screen';
import { SceneStage } from '../components/scene/SceneStage';
import { CONSUMER_GOODS } from '../data/goods';
import { FOOD_PLANS, HEALTH_PLANS, HOUSING, VEHICLES, housingById, vehicleById } from '../data/living';
import { formatBig } from '../game/BigNumber';
import { childStage } from '../game/lifeCosts';
import { monthlyBillsFor, totalIncomePerSecond, useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';

type Section = 'home' | 'food' | 'transport' | 'items' | 'family';
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'home', label: 'Housing' },
  { id: 'food', label: 'Food' },
  { id: 'transport', label: 'Transport' },
  { id: 'items', label: 'Items' },
  { id: 'family', label: 'Family' },
];

export function LivingScreen() {
  const state = useLifeStore(useShallow((current) => ({
    housing: current.housing,
    vehicle: current.vehicle,
    foodPlanId: current.foodPlanId,
    healthPlanId: current.healthPlanId,
    lateFees: current.lateFees,
    partner: current.partner,
    datingCandidate: current.datingCandidate,
    children: current.children,
    gameMonth: current.gameMonth,
    nanny: current.nanny,
    ownedGoods: current.ownedGoods,
    monthlyIncome: totalIncomePerSecond(current) * current.monthLengthSeconds,
    monthlyCosts: monthlyBillsFor(current).total + current.lateFees,
    chooseHousing: current.chooseHousing,
    sellHome: current.sellHome,
    chooseVehicle: current.chooseVehicle,
    sellVehicle: current.sellVehicle,
    setFoodPlan: current.setFoodPlan,
    setHealthPlan: current.setHealthPlan,
    buyGood: current.buyGood,
    relationshipAction: current.relationshipAction,
    togglePartnerWork: current.togglePartnerWork,
    acceptDatingCandidate: current.acceptDatingCandidate,
    skipDatingCandidate: current.skipDatingCandidate,
    meetPartner: current.meetPartner,
    toggleNanny: current.toggleNanny,
    haveChild: current.haveChild,
  })));
  const [section, setSection] = React.useState<Section>('home');
  const home = housingById(state.housing.id);
  const vehicle = vehicleById(state.vehicle.id);
  const monthlyIncome = state.monthlyIncome;
  const bills = state.monthlyCosts;
  const familySize = 1 + (state.partner ? 1 : 0) + state.children.length;
  const sceneLocation = section === 'family' ? 'park' : section === 'food' ? 'cafe' : section === 'transport' || state.housing.id === 'homeless' ? 'street' : 'home';

  const sellHome = () => Alert.alert('Sell home?', 'You receive 94% of market value after mortgage payoff and become homeless.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sell', onPress: () => state.sellHome() }]);
  const sellVehicle = () => Alert.alert('Give up vehicle?', 'Owned vehicles sell for 92% of current value. You will return to walking.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => state.sellVehicle() }]);
  const divorce = () => Alert.alert('Confirm divorce?', 'Cash and positive net assets are split equally.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Divorce', style: 'destructive', onPress: () => state.relationshipAction('divorce') }]);

  return (
    <Screen>
      <LifeHeader />
      <View style={styles.tabs}>{SECTIONS.map((item) => <Pressable accessibilityRole="button" key={item.id} style={[styles.tab, section === item.id && styles.tabActive]} onPress={() => setSection(item.id)}><Text style={[styles.tabText, section === item.id && styles.tabTextActive]}>{item.label}</Text></Pressable>)}</View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SceneStage location={sceneLocation} pose={state.partner && section === 'family' ? 'talk' : 'idle'} compact />
        <Card style={styles.budgetCard}>
          <View style={styles.budgetRow}><View><Text style={styles.budgetLabel}>MONTHLY INCOME</Text><Text style={styles.income}>${formatBig(monthlyIncome)}</Text></View><View style={styles.budgetRight}><Text style={styles.budgetLabel}>MONTHLY COSTS</Text><Text style={styles.expense}>${formatBig(bills)}</Text></View></View>
          <Text style={monthlyIncome - bills >= 0 ? styles.surplus : styles.deficit}>{monthlyIncome - bills >= 0 ? 'SURPLUS' : 'SHORTFALL'} ${formatBig(Math.abs(monthlyIncome - bills))}/month</Text>
        </Card>

        {section === 'home' ? <>
          <Text style={styles.eyebrow}>CURRENT HOUSING</Text>
          <Card style={styles.current}>
            <View style={styles.row}><Text style={styles.bigIcon}>{home.emoji}</Text><View style={styles.flex}><Text style={styles.currentTitle}>{home.name}</Text><Text style={styles.meta}>{state.housing.id === 'homeless' ? 'No rent · No utilities · Entry jobs only' : `${state.housing.tenure.toUpperCase()} · Comfort ${home.comfort} · Status ${home.status}`}</Text><Text style={state.housing.id === 'homeless' ? styles.danger : styles.green}>{state.housing.id === 'homeless' ? 'A room is required before you can study.' : `${familySize}/${home.capacity} residents`}</Text></View></View>
            {state.housing.marketValue > 0 ? <><Text style={styles.equity}>Value ${formatBig(state.housing.marketValue)} · Debt ${formatBig(state.housing.mortgageBalance)}</Text><AppButton variant="danger" onPress={sellHome}>SELL HOME</AppButton></> : null}
          </Card>
          <Text style={styles.section}>CHOOSE HOUSING</Text>
          {HOUSING.map((item) => {
            const current = item.id === state.housing.id;
            const monthly = item.rent + item.utilities + item.upkeep;
            return <Card key={item.id} style={[styles.item, current && styles.selected]}><View style={styles.row}><Text style={styles.itemIcon}>{item.emoji}</Text><View style={styles.flex}><Text style={styles.itemTitle}>{item.name}</Text><Text style={styles.meta}>Comfort {item.comfort} · Status {item.status} · Capacity {item.capacity}</Text><Text style={styles.cost}>{item.id === 'homeless' ? '$0/month' : item.purchasePrice > 0 ? `$${formatBig(item.purchasePrice)} purchase · $${formatBig(item.utilities + item.upkeep)}/month running` : `$${formatBig(monthly)}/month total`}</Text></View></View>{current ? <Text style={styles.owned}>CURRENT CHOICE</Text> : item.id === 'homeless' ? <AppButton variant="ghost" onPress={() => state.chooseHousing(item.id, 'homeless')}>LEAVE HOUSING</AppButton> : item.purchasePrice > 0 ? <View style={styles.buttonRow}><AppButton style={styles.flex} onPress={() => state.chooseHousing(item.id, 'mortgage')}>20% DOWN</AppButton><AppButton variant="ghost" style={styles.flex} onPress={() => state.chooseHousing(item.id, 'owned')}>BUY CASH</AppButton></View> : <AppButton variant="ghost" onPress={() => state.chooseHousing(item.id, 'rent')}>RENT · PAY ${formatBig(item.rent)} NOW</AppButton>}</Card>;
          })}
        </> : null}

        {section === 'food' ? <>
          <Text style={styles.eyebrow}>CHOOSE FOOD PLAN</Text>
          <Text style={styles.explainer}>Food is charged once each game month. Better meals protect health and unlock education and careers.</Text>
          {FOOD_PLANS.map((item, index) => {
            const current = state.foodPlanId === item.id;
            return <Card key={item.id} style={[styles.item, current && styles.selected]}><View style={styles.option}><View style={styles.flex}><Text style={styles.itemTitle}>{item.name}</Text><Text style={styles.meta}>Food level {index} · Happiness {item.happiness >= 0 ? '+' : ''}{item.happiness} · Health {item.health >= 0 ? '+' : ''}{item.health}/month</Text></View><Text style={styles.cost}>${formatBig(item.cost)}/mo</Text></View><AppButton variant={current ? 'green' : 'ghost'} disabled={current} onPress={() => state.setFoodPlan(item.id)}>{current ? 'ACTIVE PLAN' : 'SELECT PLAN'}</AppButton></Card>;
          })}
          <Text style={styles.section}>HEALTH COVER</Text>
          {HEALTH_PLANS.map((item) => {
            const current = state.healthPlanId === item.id;
            return <Card key={item.id} style={[styles.item, current && styles.selected]}><View style={styles.option}><View style={styles.flex}><Text style={styles.itemTitle}>{item.name}</Text><Text style={styles.meta}>Health +{item.health} each month</Text></View><Text style={styles.cost}>${formatBig(item.cost)}/mo</Text></View><AppButton variant={current ? 'green' : 'ghost'} disabled={current} onPress={() => state.setHealthPlan(item.id)}>{current ? 'ACTIVE PLAN' : 'SELECT PLAN'}</AppButton></Card>;
          })}
        </> : null}

        {section === 'transport' ? <>
          <Text style={styles.eyebrow}>CURRENT TRANSPORT</Text>
          <Card style={styles.current}><View style={styles.row}><Text style={styles.bigIcon}>{vehicle.emoji}</Text><View style={styles.flex}><Text style={styles.currentTitle}>{vehicle.name}</Text><Text style={styles.meta}>{state.vehicle.tenure.toUpperCase()} · Reliability {vehicle.reliability} · Status {vehicle.status}</Text><Text style={styles.green}>${formatBig(state.vehicle.monthlyPayment + vehicle.fuel + vehicle.insurance + vehicle.maintenance)}/month total</Text></View></View>{state.vehicle.id !== 'walk' && state.vehicle.id !== 'public' ? <><Text style={styles.equity}>Value ${formatBig(state.vehicle.marketValue)} · Debt ${formatBig(state.vehicle.debt)}</Text><AppButton variant="danger" onPress={sellVehicle}>SELL / END LEASE</AppButton></> : null}</Card>
          <Text style={styles.section}>CHOOSE TRANSPORT</Text>
          {VEHICLES.map((item) => {
            const current = item.id === state.vehicle.id;
            const running = item.fuel + item.insurance + item.maintenance;
            return <Card key={item.id} style={[styles.item, current && styles.selected]}><View style={styles.row}><Text style={styles.itemIcon}>{item.emoji}</Text><View style={styles.flex}><Text style={styles.itemTitle}>{item.name}</Text><Text style={styles.meta}>Reliability {item.reliability} · Transport status {item.status}</Text><Text style={styles.cost}>{item.price > 0 ? `$${formatBig(item.price)} price · $${formatBig(running)}/month running` : `$${formatBig(running)}/month`}</Text></View></View>{current ? <Text style={styles.owned}>CURRENT CHOICE</Text> : item.id === 'walk' ? <AppButton variant="ghost" onPress={() => state.chooseVehicle(item.id, 'walk')}>WALK FOR FREE</AppButton> : item.id === 'public' ? <AppButton variant="ghost" onPress={() => state.chooseVehicle(item.id, 'public')}>USE PUBLIC TRANSPORT</AppButton> : <View style={styles.buttonRow}><AppButton style={styles.flex} onPress={() => state.chooseVehicle(item.id, 'finance')}>FINANCE</AppButton><AppButton variant="ghost" style={styles.flex} onPress={() => state.chooseVehicle(item.id, 'lease')}>LEASE</AppButton><AppButton variant="green" style={styles.flex} onPress={() => state.chooseVehicle(item.id, 'owned')}>BUY</AppButton></View>}</Card>;
          })}
        </> : null}

        {section === 'items' ? <>
          <Text style={styles.eyebrow}>PERSONAL ITEMS & COLLECTIBLES</Text>
          <Text style={styles.explainer}>Buy phones, laptops, timepieces, and paintings. Each purchase is permanent, improves happiness once, and keeps part of its value in your net worth.</Text>
          {CONSUMER_GOODS.map((item) => {
            const owned = state.ownedGoods.includes(item.id);
            return <Card key={item.id} style={[styles.item, owned && styles.selected]}><View style={styles.row}><Text style={styles.itemIcon}>{item.emoji}</Text><View style={styles.flex}><Text style={styles.itemTitle}>{item.name}</Text><Text style={styles.meta}>{item.category} · Happiness +{item.happiness} · Resale value {Math.round(item.resaleRate * 100)}%</Text><Text style={styles.cost}>${formatBig(item.price)}</Text><Text style={styles.itemDescription}>{item.description}</Text></View></View><AppButton disabled={owned} variant={owned ? 'green' : 'gold'} onPress={() => state.buyGood(item.id)} style={styles.action}>{owned ? 'OWNED' : `BUY · $${formatBig(item.price)}`}</AppButton></Card>;
          })}
        </> : null}

        {section === 'family' ? <>
          <Text style={styles.eyebrow}>RELATIONSHIPS</Text>
          {state.partner ? <Card style={styles.current}><View style={styles.matchHeader}><Text style={styles.matchAvatar}>{state.partner.avatarEmoji}</Text><View style={styles.flex}><Text style={styles.currentTitle}>{state.partner.name} · {state.partner.stage.toUpperCase()}</Text><Text style={styles.meta}>Age {state.partner.age} · {state.partner.pronouns} · {state.partner.occupation}</Text><Text style={styles.personality}>{state.partner.personality}</Text></View></View><Text style={styles.meta}>Together {state.partner.monthsTogether} months · Income ${formatBig(state.partner.stayAtHome ? 0 : state.partner.jobIncome)}/mo</Text><View style={styles.setting}><Text style={styles.meta}>Stay home with family</Text><Switch value={state.partner.stayAtHome} onValueChange={state.togglePartnerWork} /></View><Text style={styles.meterLabel}>AFFECTION {Math.round(state.partner.affection)}%</Text><ProgressBar progress={state.partner.affection / 100} color="#FF79A8" /><View style={styles.buttonRow}><AppButton style={styles.flex} onPress={() => state.relationshipAction('date')}>DATE · $120</AppButton><AppButton variant="ghost" style={styles.flex} onPress={() => state.relationshipAction('gift')}>GIFT · $600</AppButton></View>{state.partner.stage === 'dating' ? <AppButton variant="green" style={styles.action} onPress={() => state.relationshipAction('propose')}>PROPOSE · $3K</AppButton> : null}{state.partner.stage === 'engaged' ? <AppButton variant="green" style={styles.action} onPress={() => state.relationshipAction('marry')}>WEDDING · $10K</AppButton> : null}{state.partner.stage === 'married' ? <AppButton variant="danger" style={styles.action} onPress={divorce}>DIVORCE</AppButton> : <AppButton variant="danger" style={styles.action} onPress={() => state.relationshipAction('breakup')}>BREAK UP</AppButton>}</Card> : state.datingCandidate ? <Card style={styles.matchCard}><Text style={styles.matchLabel}>TODAY’S MATCH</Text><View style={styles.matchHeader}><Text style={styles.matchAvatar}>{state.datingCandidate.avatarEmoji}</Text><View style={styles.flex}><Text style={styles.currentTitle}>{state.datingCandidate.name}, {state.datingCandidate.age}</Text><Text style={styles.meta}>{state.datingCandidate.gender} · {state.datingCandidate.pronouns}</Text><Text style={styles.meta}>{state.datingCandidate.occupation} · ${formatBig(state.datingCandidate.jobIncome)}/month</Text><Text style={styles.personality}>{state.datingCandidate.personality}</Text></View></View><View style={styles.buttonRow}><AppButton variant="green" style={styles.flex} onPress={() => state.acceptDatingCandidate()}>START DATING</AppButton><AppButton variant="ghost" style={styles.flex} onPress={state.skipDatingCandidate}>NEXT PERSON</AppButton></View></Card> : <Card><Text style={styles.itemTitle}>Single</Text><Text style={styles.meta}>Browse a generated profile with an age, career, personality, pronouns, and income before deciding to date.</Text><AppButton style={styles.action} onPress={state.meetPartner}>FIND A MATCH</AppButton></Card>}
          <Text style={styles.section}>CHILDREN</Text>
          <Card><View style={styles.setting}><View style={styles.flex}><Text style={styles.itemTitle}>Hire a nanny</Text><Text style={styles.meta}>$600/month · prevents family energy penalties.</Text></View><Switch value={state.nanny} onValueChange={state.toggleNanny} /></View><AppButton disabled={!state.partner} style={styles.action} onPress={() => state.haveChild()}>WELCOME A CHILD · $1.5K</AppButton></Card>
          {state.children.map((child) => { const age = Math.max(0, (state.gameMonth - child.birthMonth) / 12); return <Card key={child.id} style={styles.item}><Text style={styles.itemTitle}>{child.name} · {childStage(age).toUpperCase()}</Text><Text style={styles.meta}>Age {Math.floor(age)} · Happiness {Math.round(child.happiness)} · Education {Math.round(child.education)}</Text><ProgressBar progress={child.happiness / 100} color={colors.gold} /></Card>; })}
        </> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 8 },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.gold },
  tabText: { color: colors.muted, fontSize: 9, fontWeight: '900' },
  tabTextActive: { color: colors.goldDark },
  content: { padding: 16, paddingBottom: 90 },
  budgetCard: { marginVertical: 12, backgroundColor: '#EAF5F4' },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetRight: { alignItems: 'flex-end' },
  budgetLabel: { color: colors.muted, fontSize: 8, fontWeight: '900' },
  income: { color: colors.greenDark, fontSize: 18, fontWeight: '900' },
  expense: { color: colors.danger, fontSize: 18, fontWeight: '900' },
  surplus: { color: colors.greenDark, fontSize: 10, fontWeight: '900', marginTop: 8 },
  deficit: { color: colors.danger, fontSize: 10, fontWeight: '900', marginTop: 8 },
  eyebrow: { color: colors.greenDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8 },
  explainer: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 10 },
  section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 22, marginBottom: 8 },
  current: { borderColor: colors.goldDark, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  bigIcon: { fontSize: 43, marginRight: 12 },
  currentTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  green: { color: colors.greenDark, fontSize: 10, fontWeight: '900', marginTop: 4 },
  danger: { color: colors.danger, fontSize: 10, fontWeight: '900', marginTop: 4 },
  equity: { color: colors.goldDark, fontSize: 11, marginVertical: 11 },
  item: { marginBottom: 8 },
  selected: { borderColor: colors.greenDark, backgroundColor: '#F2FAF6' },
  itemIcon: { fontSize: 32, width: 47 },
  itemTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  itemDescription: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  cost: { color: colors.goldDark, fontSize: 10, fontWeight: '800', marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  owned: { color: colors.greenDark, textAlign: 'center', fontSize: 10, fontWeight: '900', marginTop: 10 },
  option: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  action: { marginTop: 10 },
  meterLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', marginTop: 14 },
  setting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  matchCard: { borderColor: '#FF79A8', backgroundColor: '#FFF4F7' },
  matchLabel: { color: '#A73562', fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginBottom: 9 },
  matchHeader: { flexDirection: 'row', alignItems: 'center' },
  matchAvatar: { width: 58, fontSize: 43, textAlign: 'center', marginRight: 8 },
  personality: { color: '#A73562', fontSize: 10, fontWeight: '800', marginTop: 4 },
});
