import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import {
  doubleBlackjack,
  handValue,
  hitBlackjack,
  splitBlackjack,
  standBlackjack,
  startBlackjackRound,
  type BlackjackRound,
  type PlayingCard,
} from '../game/blackjack';
import { horseBetPayout, horseOdds, INITIAL_HORSES, runHorseRace, type Horse, type HorseBet } from '../game/horseRacing';
import { randomInt } from '../game/random';
import { RED_NUMBERS, roulettePayout, type RouletteBet } from '../game/roulette';
import { formatBig, toNumber } from '../game/BigNumber';
import { calculateLifeNetWorth, useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { LifeHeader } from '../components/LifeHeader';
import { Screen } from '../components/Screen';
import { SceneStage } from '../components/scene/SceneStage';
import { ActionDock } from '../components/scene/ActionDock';

type CasinoGame = 'blackjack' | 'roulette' | 'horses';

function CardFace({ card, hidden = false, index = 0 }: { card: PlayingCard; hidden?: boolean; index?: number }) {
  const red = card.suit === '♥' || card.suit === '♦';
  return (
    <Animated.View entering={FadeInRight.delay(index * 80)} style={[styles.playingCard, hidden && styles.hiddenCard]}>
      {hidden ? <Text style={styles.cardBack}>♛</Text> : <><Text style={[styles.cardRank, red && styles.redCard]}>{card.rank}</Text><Text style={[styles.cardSuit, red && styles.redCard]}>{card.suit}</Text></>}
    </Animated.View>
  );
}

function BlackjackGame() {
  const state = useLifeStore();
  const [betText, setBetText] = useState('100');
  const [round, setRound] = useState<BlackjackRound | null>(null);
  const [message, setMessage] = useState('Dealer stands on 17 • Blackjack pays 3:2');

  const applyRound = (next: BlackjackRound) => {
    setRound(next);
    if (next.finished) {
      const payout = next.payouts.reduce((sum, value) => sum + value, 0);
      state.creditCasinoPayout(payout);
      setMessage(payout > 0 ? `Round complete • returned $${formatBig(payout, 2)}` : 'Dealer wins this round');
    }
  };
  const start = () => {
    const bet = Math.max(1, Number(betText) || 0);
    if (!state.placeCasinoWager(bet)) {
      setMessage('Bet blocked by cash balance or daily loss limit');
      return;
    }
    const next = startBlackjackRound(bet, state.runtimeNow + state.casinoStats.gamesPlayed * 7919);
    applyRound(next);
  };
  const hit = () => { if (round) applyRound(hitBlackjack(round)); };
  const stand = () => { if (round) applyRound(standBlackjack(round)); };
  const double = () => {
    if (!round) return;
    const hand = round.hands[round.activeHand];
    if (hand && state.placeCasinoWager(hand.bet)) applyRound(doubleBlackjack(round));
  };
  const split = () => {
    if (!round) return;
    const hand = round.hands[round.activeHand];
    if (hand && state.placeCasinoWager(hand.bet)) applyRound(splitBlackjack(round));
  };
  const activeHand = round?.hands[round.activeHand];
  const canSplit = !!activeHand && activeHand.cards.length === 2 && activeHand.cards[0]?.rank === activeHand.cards[1]?.rank;
  return (
    <View>
      <Card style={styles.gameCard}>
        <Text style={styles.gameTitle}>Blackjack</Text>
        <Text style={styles.rule}>{message}</Text>
        {round ? (
          <>
            <Text style={styles.handLabel}>DEALER • {round.finished ? handValue(round.dealer) : '?'}</Text>
            <View style={styles.cards}>{round.dealer.map((card, index) => <CardFace key={card.id} card={card} index={index} hidden={!round.finished && index === 1} />)}</View>
            {round.hands.map((hand, handIndex) => (
              <View key={`hand-${handIndex}`} style={[styles.hand, handIndex === round.activeHand && !round.finished && styles.activeHand]}>
                <Text style={styles.handLabel}>HAND {handIndex + 1} • {handValue(hand.cards)} • BET ${formatBig(hand.bet)}</Text>
                <View style={styles.cards}>{hand.cards.map((card, index) => <CardFace key={`${card.id}-${handIndex}`} card={card} index={index} />)}</View>
                {round.finished ? <Text style={styles.payout}>Return ${formatBig(round.payouts[handIndex] ?? 0, 2)}</Text> : null}
              </View>
            ))}
          </>
        ) : <Text style={styles.emptyGame}>Set a chip value and deal a six-deck shoe.</Text>}
        <TextInput value={betText} onChangeText={setBetText} keyboardType="number-pad" placeholder="Bet" placeholderTextColor={colors.muted} style={styles.input} />
        {!round || round.finished ? <AppButton onPress={start} style={styles.gameButton}>DEAL</AppButton> : (
          <>
            <View style={styles.buttonRow}><AppButton variant="green" onPress={hit} style={styles.flexButton}>HIT</AppButton><AppButton onPress={stand} style={styles.flexButton}>STAND</AppButton></View>
            <View style={styles.buttonRow}><AppButton variant="ghost" disabled={activeHand?.cards.length !== 2} onPress={double} style={styles.flexButton}>DOUBLE</AppButton><AppButton variant="ghost" disabled={!canSplit} onPress={split} style={styles.flexButton}>SPLIT</AppButton></View>
          </>
        )}
      </Card>
    </View>
  );
}

type RouletteChoice = 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3' | 'column1' | 'column2' | 'column3' | 'straight' | 'split';

const ROULETTE_CHOICES: RouletteChoice[] = ['red', 'black', 'odd', 'even', 'low', 'high', 'dozen1', 'dozen2', 'dozen3', 'column1', 'column2', 'column3', 'straight', 'split'];

function rouletteBetFrom(choice: RouletteChoice, amount: number, number: number): RouletteBet {
  if (choice === 'straight') return { type: 'straight', amount, number: Math.max(0, Math.min(36, number)) };
  if (choice === 'split') return { type: 'split', amount, numbers: [Math.max(0, Math.min(35, number)), Math.max(1, Math.min(36, number + 1))] };
  if (choice.startsWith('dozen')) return { type: 'dozen', amount, index: Number(choice.at(-1)) as 1 | 2 | 3 };
  if (choice.startsWith('column')) return { type: 'column', amount, index: Number(choice.at(-1)) as 1 | 2 | 3 };
  return { type: choice as 'red' | 'black' | 'odd' | 'even' | 'low' | 'high', amount };
}

function RouletteGame() {
  const state = useLifeStore();
  const [choice, setChoice] = useState<RouletteChoice>('red');
  const [amountText, setAmountText] = useState('100');
  const [numberText, setNumberText] = useState('17');
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [message, setMessage] = useState('European wheel • single zero');
  const rotation = useSharedValue(0);
  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  const spin = () => {
    const amount = Math.max(1, Number(amountText) || 0);
    if (!state.placeCasinoWager(amount)) {
      setMessage('Bet blocked by cash balance or daily loss limit');
      return;
    }
    const draw = randomInt({ seed: state.runtimeNow + state.casinoStats.gamesPlayed * 104729 }, 0, 36);
    const bet = rouletteBetFrom(choice, amount, Number(numberText) || 0);
    const payout = roulettePayout(bet, draw.value);
    rotation.set(withTiming(rotation.value + 1_440 + draw.value * 9.73, { duration: 1_500 }));
    setResult(draw.value);
    setHistory((items) => [draw.value, ...items].slice(0, 10));
    state.creditCasinoPayout(payout);
    setMessage(payout > 0 ? `Winner • returned $${formatBig(payout, 2)}` : 'No payout this spin');
  };
  return (
    <Card style={styles.gameCard}>
      <Text style={styles.gameTitle}>European Roulette</Text>
      <Text style={styles.rule}>{message}</Text>
      <Animated.View style={[styles.wheel, wheelStyle]}><Text style={styles.wheelText}>♛</Text><Text style={styles.wheelNumbers}>0 • 17 • 32 • 5</Text></Animated.View>
      <Text style={[styles.result, result !== null && result > 0 && RED_NUMBERS.has(result) ? styles.redResult : styles.blackResult]}>{result === null ? '—' : result}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
        {ROULETTE_CHOICES.map((item) => <AppButton key={item} variant={choice === item ? 'gold' : 'ghost'} onPress={() => setChoice(item)} style={styles.choiceButton}>{item.toUpperCase()}</AppButton>)}
      </ScrollView>
      {(choice === 'straight' || choice === 'split') ? <TextInput value={numberText} onChangeText={setNumberText} keyboardType="number-pad" placeholder="Starting number 0–36" placeholderTextColor={colors.muted} style={styles.input} /> : null}
      <TextInput value={amountText} onChangeText={setAmountText} keyboardType="number-pad" placeholder="Bet" placeholderTextColor={colors.muted} style={styles.input} />
      <AppButton onPress={spin} style={styles.gameButton}>SPIN WHEEL</AppButton>
      <Text style={styles.history}>History: {history.length > 0 ? history.join(' • ') : 'No spins yet'}</Text>
    </Card>
  );
}

function HorseRunner({ horse, position, raceNonce }: { horse: Horse; position: number; raceNonce: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    if (raceNonce <= 0) return;
    progress.set(0);
    progress.set(withTiming(1, { duration: 1_300 + position * 180 }));
  }, [position, progress, raceNonce]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * 215 }] }));
  return <View style={styles.lane}><Animated.Text style={[styles.horse, animated]}>🏇</Animated.Text><Text style={styles.horseName}>{horse.name}</Text></View>;
}

function HorseRacingGame() {
  const state = useLifeStore();
  const [horses, setHorses] = useState(INITIAL_HORSES);
  const [betType, setBetType] = useState<HorseBet['type']>('win');
  const [selected, setSelected] = useState(horses[0]!.id);
  const [second, setSecond] = useState(horses[1]!.id);
  const [amountText, setAmountText] = useState('100');
  const [order, setOrder] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [raceNonce, setRaceNonce] = useState(0);
  const [message, setMessage] = useState('Odds derive from rating and recent form');
  const odds = horseOdds(horses);
  const race = () => {
    const amount = Math.max(1, Number(amountText) || 0);
    if (!state.placeCasinoWager(amount)) {
      setMessage('Bet blocked by cash balance or daily loss limit');
      return;
    }
    const bet: HorseBet = betType === 'exacta' ? { type: 'exacta', amount, horseIds: [selected, second] } : { type: betType, amount, horseId: selected };
    const result = runHorseRace(horses, state.runtimeNow + state.casinoStats.gamesPlayed * 65537);
    const payout = horseBetPayout(bet, result.order, odds);
    setOrder(result.order);
    setHorses(result.horses);
    setRaceNonce((value) => value + 1);
    const winner = horses.find((horse) => horse.id === result.order[0])?.name ?? 'Unknown';
    setHistory((items) => [`${winner} won`, ...items].slice(0, 6));
    state.creditCasinoPayout(payout);
    setMessage(payout > 0 ? `Ticket returned $${formatBig(payout, 2)}` : `${winner} wins • ticket lost`);
  };
  return (
    <Card style={styles.gameCard}>
      <Text style={styles.gameTitle}>Golden Track Racing</Text>
      <Text style={styles.rule}>{message}</Text>
      <View style={styles.track}>
        {horses.map((horse) => <HorseRunner key={horse.id} horse={horse} position={Math.max(0, order.indexOf(horse.id))} raceNonce={raceNonce} />)}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
        {(['win', 'place', 'show', 'exacta'] as const).map((type) => <AppButton key={type} variant={betType === type ? 'gold' : 'ghost'} onPress={() => setBetType(type)} style={styles.choiceButton}>{type.toUpperCase()}</AppButton>)}
      </ScrollView>
      <Text style={styles.selectLabel}>FIRST HORSE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
        {horses.map((horse) => <AppButton key={horse.id} variant={selected === horse.id ? 'green' : 'ghost'} onPress={() => setSelected(horse.id)} style={styles.horseButton}>{horse.name} • {odds[horse.id]?.toFixed(2)}×</AppButton>)}
      </ScrollView>
      {betType === 'exacta' ? <><Text style={styles.selectLabel}>SECOND HORSE</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>{horses.filter((horse) => horse.id !== selected).map((horse) => <AppButton key={horse.id} variant={second === horse.id ? 'green' : 'ghost'} onPress={() => setSecond(horse.id)} style={styles.horseButton}>{horse.name}</AppButton>)}</ScrollView></> : null}
      <TextInput value={amountText} onChangeText={setAmountText} keyboardType="number-pad" placeholder="Bet" placeholderTextColor={colors.muted} style={styles.input} />
      <AppButton onPress={race} style={styles.gameButton}>START RACE</AppButton>
      <Text style={styles.history}>Results: {history.length > 0 ? history.join(' • ') : 'No races yet'}</Text>
    </Card>
  );
}

export function CasinoScreen() {
  const state = useLifeStore();
  const [game, setGame] = useState<CasinoGame>('blackjack');
  const [limitText, setLimitText] = useState(String(state.dailyLossLimit));
  const unlocked = toNumber(calculateLifeNetWorth(state)) >= 25_000;
  if (!unlocked) {
    return <Screen edges={['right', 'bottom', 'left']}><LifeHeader /><SceneStage location="casino" pose="sad" compact /><View style={styles.locked}><Text style={styles.lockIcon}>🔒</Text><Text style={styles.lockTitle}>Casino locked</Text><Text style={styles.lockText}>Reach $25K net worth to unlock the entertainment district.</Text></View><ActionDock active="casino" /></Screen>;
  }
  const netResult = state.casinoStats.totalWon - state.casinoStats.totalWagered;
  return (
    <Screen edges={['right', 'bottom', 'left']}>
      <LifeHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SceneStage location="casino" pose="celebrate" compact />
        <Text style={styles.responsible}>18+ STYLE SIMULATION • VIRTUAL CURRENCY ONLY • PLAY RESPONSIBLY</Text>
        <Text style={styles.title}>Golden Casino</Text>
        <View style={styles.tabs}>
          <AppButton variant={game === 'blackjack' ? 'gold' : 'ghost'} onPress={() => setGame('blackjack')} style={styles.tab}>♠ BLACKJACK</AppButton>
          <AppButton variant={game === 'roulette' ? 'gold' : 'ghost'} onPress={() => setGame('roulette')} style={styles.tab}>🎡 ROULETTE</AppButton>
          <AppButton variant={game === 'horses' ? 'gold' : 'ghost'} onPress={() => setGame('horses')} style={styles.tab}>🏇 RACING</AppButton>
        </View>
        <Card style={styles.limitCard}>
          <View style={styles.limitInfo}><Text style={styles.limitTitle}>Daily loss guard</Text><Text style={styles.limitUsed}>${formatBig(state.dailyCasinoLoss)} / ${formatBig(state.dailyLossLimit)}</Text></View>
          <View style={styles.limitActions}><TextInput value={limitText} onChangeText={setLimitText} keyboardType="number-pad" style={styles.limitInput} /><AppButton variant="ghost" onPress={() => state.setDailyLossLimit(Number(limitText))} style={styles.limitButton}>SET LIMIT</AppButton></View>
        </Card>
        {game === 'blackjack' ? <BlackjackGame /> : game === 'roulette' ? <RouletteGame /> : <HorseRacingGame />}
        <Card style={styles.stats}>
          <Text style={styles.statsTitle}>Casino statistics</Text>
          <Text style={styles.statsLine}>Games played: {state.casinoStats.gamesPlayed}</Text>
          <Text style={styles.statsLine}>Total wagered: ${formatBig(state.casinoStats.totalWagered)}</Text>
          <Text style={styles.statsLine}>Total returned: ${formatBig(state.casinoStats.totalWon)}</Text>
          <Text style={[styles.statsNet, { color: netResult >= 0 ? colors.green : colors.danger }]}>Net: {netResult >= 0 ? '+' : '-'}${formatBig(Math.abs(netResult))}</Text>
        </Card>
      </ScrollView>
      <ActionDock active="casino" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 110 },
  responsible: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  tabs: { flexDirection: 'row', gap: 5, marginTop: 12 },
  tab: { flex: 1, minHeight: 39, paddingHorizontal: 4 },
  limitCard: { marginTop: 10, padding: 12 },
  limitInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  limitTitle: { color: colors.text, fontWeight: '800' },
  limitUsed: { color: colors.danger, fontSize: 11, fontWeight: '900' },
  limitActions: { flexDirection: 'row', gap: 7, marginTop: 8 },
  limitInput: { flex: 1, minHeight: 38, backgroundColor: colors.surface2, borderRadius: 10, color: colors.text, paddingHorizontal: 10 },
  limitButton: { minHeight: 38 },
  gameCard: { marginTop: 10 },
  gameTitle: { color: colors.text, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  rule: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  handLabel: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 9 },
  cards: { flexDirection: 'row', gap: 6, minHeight: 76, marginTop: 5 },
  playingCard: { width: 48, height: 70, borderRadius: 8, backgroundColor: '#F7F1DF', padding: 5, justifyContent: 'space-between', shadowColor: colors.black, shadowOpacity: 0.4, shadowRadius: 4 },
  hiddenCard: { backgroundColor: colors.goldDark, justifyContent: 'center', alignItems: 'center' },
  cardBack: { color: colors.gold, fontSize: 24 },
  cardRank: { color: colors.black, fontSize: 16, fontWeight: '900' },
  cardSuit: { color: colors.black, fontSize: 20, alignSelf: 'flex-end' },
  redCard: { color: '#C12A37' },
  hand: { borderRadius: 11, padding: 7, marginTop: 5 },
  activeHand: { backgroundColor: '#2B2512' },
  payout: { color: colors.green, fontSize: 11, fontWeight: '900' },
  emptyGame: { color: colors.muted, textAlign: 'center', marginVertical: 28 },
  input: { minHeight: 44, backgroundColor: colors.surface2, borderRadius: 11, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12, marginTop: 8 },
  gameButton: { marginTop: 9 },
  buttonRow: { flexDirection: 'row', gap: 7, marginTop: 7 },
  flexButton: { flex: 1 },
  wheel: { width: 158, height: 158, borderRadius: 79, borderWidth: 12, borderColor: '#AA7B24', backgroundColor: '#16452F', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  wheelText: { color: colors.gold, fontSize: 44 },
  wheelNumbers: { color: colors.text, fontSize: 9, fontWeight: '900' },
  result: { alignSelf: 'center', minWidth: 52, textAlign: 'center', color: colors.text, fontSize: 27, fontWeight: '900', padding: 7, borderRadius: 12, marginTop: 8 },
  redResult: { backgroundColor: '#922D38' },
  blackResult: { backgroundColor: '#181818' },
  choiceRow: { gap: 5, paddingVertical: 8 },
  choiceButton: { minHeight: 35, paddingVertical: 5, paddingHorizontal: 10 },
  history: { color: colors.muted, fontSize: 10, marginTop: 10, lineHeight: 16 },
  track: { backgroundColor: '#17331F', borderRadius: 12, paddingVertical: 5, overflow: 'hidden' },
  lane: { height: 38, borderBottomWidth: 1, borderBottomColor: '#FFFFFF15', justifyContent: 'center' },
  horse: { position: 'absolute', fontSize: 25, left: 3, zIndex: 2 },
  horseName: { color: '#FFFFFF55', fontSize: 8, marginLeft: 5 },
  selectLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 8 },
  horseButton: { minHeight: 36, paddingVertical: 5 },
  stats: { marginTop: 10 },
  statsTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 7 },
  statsLine: { color: colors.muted, fontSize: 11, marginVertical: 2 },
  statsNet: { fontSize: 14, fontWeight: '900', marginTop: 6 },
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  lockIcon: { fontSize: 58 },
  lockTitle: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 10 },
  lockText: { color: colors.muted, textAlign: 'center', lineHeight: 21, marginTop: 7 },
});
