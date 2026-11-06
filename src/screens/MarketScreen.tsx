import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { MARKET_ASSETS, marketAssetById, type MarketAssetKind } from '../data/marketAssets';
import { formatBig, toNumber } from '../game/BigNumber';
import { BROKER_UNLOCK_NET_WORTH } from '../game/config';
import { positionProfitLoss } from '../game/marketEngine';
import { BROKER_FEE, calculateLifeNetWorth, hasBrokerAccess, useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { LifeHeader } from '../components/LifeHeader';
import { MarketChart } from '../components/MarketChart';
import { Screen } from '../components/Screen';
import { SceneStage } from '../components/scene/SceneStage';
import { ActionDock } from '../components/scene/ActionDock';

export function MarketScreen() {
  const state = useLifeStore(useShallow((current) => ({
    marketPrices: current.marketPrices,
    marketHistory: current.marketHistory,
    portfolio: current.portfolio,
    companies: current.companies,
    limitOrders: current.limitOrders,
    marketNews: current.marketNews,
    watchlist: current.watchlist,
    brokerAccess: hasBrokerAccess(current),
    netWorth: toNumber(calculateLifeNetWorth(current)),
    placeLimitOrder: current.placeLimitOrder,
    toggleWatchlist: current.toggleWatchlist,
    tradeMarket: current.tradeMarket,
    cancelLimitOrder: current.cancelLimitOrder,
  })));
  const { width } = useWindowDimensions();
  const [kind, setKind] = useState<MarketAssetKind>('stock');
  const [selectedId, setSelectedId] = useState('novacore');
  const [quantityText, setQuantityText] = useState('1');
  const [limitPriceText, setLimitPriceText] = useState('');
  const assets = useMemo(() => MARKET_ASSETS.filter((asset) => asset.kind === kind), [kind]);
  const selected = marketAssetById(selectedId);
  const price = state.marketPrices[selected.id] ?? selected.startPrice;
  const history = state.marketHistory[selected.id] ?? [price];
  const position = state.portfolio[selected.id] ?? { quantity: 0, averageBuyPrice: 0 };
  const quantity = Math.max(0, Number(quantityText) || 0);
  const pnl = positionProfitLoss(position.quantity, position.averageBuyPrice, price);
  const chooseKind = (next: MarketAssetKind) => {
    setKind(next);
    const first = MARKET_ASSETS.find((asset) => asset.kind === next);
    if (first) setSelectedId(first.id);
  };
  const placeLimit = (side: 'buy' | 'sell') => {
    const target = Number(limitPriceText);
    if (state.placeLimitOrder(selected.id, side, quantity, target)) setLimitPriceText('');
  };
  const portfolioValue = Object.entries(state.portfolio).reduce((sum, [id, item]) => sum + item.quantity * (state.marketPrices[id] ?? 0), 0);
  const netWorth = state.netWorth;
  if (!state.brokerAccess) {
    return (
      <Screen>
        <LifeHeader />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SceneStage location="bank" pose="idle" compact />
          <View style={styles.locked}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockBadge}>UNLOCK AT $25K NET WORTH</Text>
            <Text style={styles.lockTitle}>The broker is watching your progress</Text>
            <Text style={styles.lockBody}>Build your cash, career, and assets to unlock stocks, coins, limit orders, and dividends.</Text>
            <Text style={styles.lockProgress}>${formatBig(netWorth, 2)} / ${formatBig(BROKER_UNLOCK_NET_WORTH)}</Text>
          </View>
        </ScrollView>
        <ActionDock active="market" />
      </Screen>
    );
  }
  return (
    <Screen>
      <LifeHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SceneStage location="bank" pose="talk" compact />
        <View style={styles.headingRow}>
          <View><Text style={styles.eyebrow}>LIVE SIMULATED MARKET</Text><Text style={styles.title}>Broker</Text></View>
          <View style={styles.fee}><Text style={styles.feeLabel}>BROKER FEE</Text><Text style={styles.feeValue}>{(BROKER_FEE * 100).toFixed(1)}%</Text></View>
        </View>
        <View style={styles.tabs}>
          <AppButton variant={kind === 'stock' ? 'gold' : 'ghost'} onPress={() => chooseKind('stock')} style={styles.tab}>STOCKS</AppButton>
          <AppButton variant={kind === 'coin' ? 'gold' : 'ghost'} onPress={() => chooseKind('coin')} style={styles.tab}>COINS</AppButton>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assetStrip}>
          {assets.map((asset) => {
            const assetPrice = state.marketPrices[asset.id] ?? asset.startPrice;
            const assetHistory = state.marketHistory[asset.id] ?? [assetPrice];
            const change = ((assetPrice / (assetHistory[0] ?? assetPrice)) - 1) * 100;
            return (
              <AppButton key={asset.id} variant={selected.id === asset.id ? 'gold' : 'ghost'} onPress={() => setSelectedId(asset.id)} style={styles.assetButton}>
                {`${asset.symbol}\n$${formatBig(assetPrice, 2)}\n${change >= 0 ? '+' : ''}${change.toFixed(1)}%`}
              </AppButton>
            );
          })}
        </ScrollView>

        <Card style={styles.chartCard}>
          <View style={styles.priceRow}>
            <View><Text style={styles.assetName}>{selected.name}</Text><Text style={styles.sector}>{selected.sector} • {selected.kind.toUpperCase()}</Text></View>
            <View style={styles.priceRight}><Text style={styles.price}>${formatBig(price, price < 1 ? 4 : 2)}</Text><Text style={styles.watch}>{state.watchlist.includes(selected.id) ? '★ WATCHING' : '☆ NOT WATCHED'}</Text></View>
          </View>
          <MarketChart values={history} width={Math.max(260, width - 66)} />
          <AppButton variant="ghost" onPress={() => state.toggleWatchlist(selected.id)} style={styles.watchButton}>{state.watchlist.includes(selected.id) ? 'REMOVE WATCHLIST' : 'ADD TO WATCHLIST'}</AppButton>
        </Card>

        <Card style={styles.tradeCard}>
          <Text style={styles.cardTitle}>Trade {selected.symbol}</Text>
          <Text style={styles.position}>Owned {position.quantity.toFixed(3)} • Avg ${formatBig(position.averageBuyPrice, 2)} • P/L {pnl >= 0 ? '+' : '-'}${formatBig(Math.abs(pnl), 2)}</Text>
          <TextInput value={quantityText} onChangeText={setQuantityText} keyboardType="decimal-pad" placeholder="Quantity" placeholderTextColor={colors.muted} style={styles.input} />
          <Text style={styles.estimate}>Estimated ${formatBig(price * quantity * (1 + BROKER_FEE), 2)}</Text>
          <View style={styles.tradeActions}>
            <AppButton variant="green" onPress={() => state.tradeMarket(selected.id, 'buy', quantity)} style={styles.half}>BUY MARKET</AppButton>
            <AppButton variant="danger" onPress={() => state.tradeMarket(selected.id, 'sell', quantity)} style={styles.half}>SELL MARKET</AppButton>
          </View>
          <Text style={styles.limitLabel}>LIMIT ORDER</Text>
          <TextInput value={limitPriceText} onChangeText={setLimitPriceText} keyboardType="decimal-pad" placeholder="Target price" placeholderTextColor={colors.muted} style={styles.input} />
          <View style={styles.tradeActions}>
            <AppButton variant="ghost" onPress={() => placeLimit('buy')} style={styles.half}>LIMIT BUY</AppButton>
            <AppButton variant="ghost" onPress={() => placeLimit('sell')} style={styles.half}>LIMIT SELL</AppButton>
          </View>
        </Card>

        <Text style={styles.section}>PORTFOLIO • ${formatBig(portfolioValue, 2)}</Text>
        {Object.entries(state.portfolio).filter(([, item]) => item.quantity > 0).map(([id, item]) => {
          const asset = marketAssetById(id);
          const current = state.marketPrices[id] ?? 0;
          const positionPnl = positionProfitLoss(item.quantity, item.averageBuyPrice, current);
          return <Card key={id} style={styles.portfolioRow}><View style={styles.flex}><Text style={styles.portfolioName}>{asset.symbol} • {asset.name}</Text><Text style={styles.portfolioMeta}>{item.quantity.toFixed(3)} units • avg ${formatBig(item.averageBuyPrice, 2)}</Text></View><Text style={[styles.portfolioPnl, { color: positionPnl >= 0 ? colors.green : colors.danger }]}>{positionPnl >= 0 ? '+' : '-'}${formatBig(Math.abs(positionPnl), 2)}</Text></Card>;
        })}
        {state.companies.some((company) => company.isPublic) ? <Text style={styles.section}>YOUR IPO LISTINGS</Text> : null}
        {state.companies.filter((company) => company.isPublic).map((company) => {
          const impliedPrice = Math.max(1, company.level * company.reputation * 0.75);
          return <Card key={company.id} style={styles.portfolioRow}><View style={styles.flex}><Text style={styles.portfolioName}>{company.name} • PUBLIC</Text><Text style={styles.portfolioMeta}>You retain {Math.round(company.ownership * 100)}% ownership • simulated exchange listing</Text></View><Text style={styles.portfolioPnl}>${formatBig(impliedPrice, 2)}</Text></Card>;
        })}
        {state.limitOrders.length > 0 ? <Text style={styles.section}>OPEN ORDERS</Text> : null}
        {state.limitOrders.map((order) => <Card key={order.id} style={styles.order}><Text style={styles.orderText}>{order.side.toUpperCase()} {order.quantity} {marketAssetById(order.assetId).symbol} @ ${formatBig(order.targetPrice, 2)}</Text><AppButton variant="ghost" onPress={() => state.cancelLimitOrder(order.id)} style={styles.cancel}>CANCEL</AppButton></Card>)}

        <Text style={styles.section}>MARKET NEWS</Text>
        {state.marketNews.length === 0 ? <Card><Text style={styles.empty}>The market is calm. New headlines arrive during trading.</Text></Card> : state.marketNews.map((item) => <Card key={item.id} style={styles.news}><Text style={styles.newsSector}>{item.sector.toUpperCase()}</Text><Text style={styles.newsTitle}>{item.headline}</Text><Text style={[styles.newsImpact, { color: item.impact >= 0 ? colors.green : colors.danger }]}>{item.impact >= 0 ? '+' : ''}{(item.impact * 100).toFixed(1)}% sector impact</Text></Card>)}
      </ScrollView>
      <ActionDock active="market" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  locked: { alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 10, backgroundColor: '#FFF8E8', borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  lockIcon: { fontSize: 42 },
  lockBadge: { color: '#6F4A00', backgroundColor: '#FFD95C', borderRadius: 12, overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 6, fontSize: 9, fontWeight: '900', marginTop: 8 },
  lockTitle: { color: colors.text, fontSize: 22, lineHeight: 26, fontWeight: '900', textAlign: 'center', marginTop: 13 },
  lockBody: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  lockProgress: { color: colors.greenDark, fontSize: 18, fontWeight: '900', marginTop: 14 },
  content: { padding: 16, paddingBottom: 110 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  fee: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 11, padding: 8 },
  feeLabel: { color: colors.muted, fontSize: 7, fontWeight: '900' },
  feeValue: { color: colors.gold, fontSize: 14, fontWeight: '900' },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 13 },
  tab: { flex: 1, minHeight: 39 },
  assetStrip: { gap: 6, paddingVertical: 10 },
  assetButton: { width: 88, minHeight: 74, paddingHorizontal: 5, paddingVertical: 7 },
  chartCard: { padding: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  assetName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  sector: { color: colors.muted, fontSize: 9, marginTop: 2 },
  priceRight: { alignItems: 'flex-end' },
  price: { color: colors.gold, fontSize: 20, fontWeight: '900' },
  watch: { color: colors.muted, fontSize: 8, fontWeight: '800' },
  watchButton: { marginTop: 9, minHeight: 38 },
  tradeCard: { marginTop: 11 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  position: { color: colors.muted, fontSize: 10, marginTop: 4, marginBottom: 9 },
  input: { minHeight: 45, backgroundColor: colors.surface2, borderRadius: 12, color: colors.text, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, marginTop: 7 },
  estimate: { color: colors.muted, textAlign: 'right', fontSize: 10, marginTop: 4 },
  tradeActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  half: { flex: 1, minHeight: 40 },
  limitLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginTop: 15 },
  section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 23, marginBottom: 8 },
  portfolioRow: { marginBottom: 7, flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  portfolioName: { color: colors.text, fontSize: 13, fontWeight: '900' },
  portfolioMeta: { color: colors.muted, fontSize: 9, marginTop: 2 },
  portfolioPnl: { fontWeight: '900' },
  order: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  orderText: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '800' },
  cancel: { minHeight: 34, paddingVertical: 5 },
  news: { marginBottom: 7 },
  newsSector: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  newsTitle: { color: colors.text, fontWeight: '800', marginTop: 3 },
  newsImpact: { fontSize: 10, fontWeight: '900', marginTop: 5 },
  empty: { color: colors.muted, textAlign: 'center' },
});
