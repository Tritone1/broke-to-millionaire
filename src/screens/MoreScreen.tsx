import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { LifeHeader } from '../components/LifeHeader';
import { ActionDock } from '../components/scene/ActionDock';
import { SceneStage } from '../components/scene/SceneStage';
import { Screen } from '../components/Screen';
import { formatBig, toNumber } from '../game/BigNumber';
import { useTranslation } from '../hooks/useTranslation';
import type { LifeRootParamList } from '../navigation/AppNavigator';
import { calculateLifeNetWorth, useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';

export function MoreScreen() {
  const navigation = useNavigation<NavigationProp<LifeRootParamList>>();
  const { t } = useTranslation();
  const character = useLifeStore((state) => state.character);
  const netWorth = useLifeStore((state) => toNumber(calculateLifeNetWorth(state)));
  const casinoUnlocked = netWorth >= 25_000;
  return (
    <Screen>
      <LifeHeader />
      <SceneStage location="park" pose="idle" compact />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{character.name.toUpperCase()}</Text>
        <Text style={styles.title}>{t('moreToExplore')}</Text>
        <Card style={styles.card}><Text style={styles.icon}>🛒</Text><Text style={styles.cardTitle}>{t('store')}</Text><Text style={styles.body}>{t('storeDescription')}</Text><AppButton onPress={() => navigation.navigate('Store')}>{t('openStore').toUpperCase()}</AppButton></Card>
        <Card style={styles.card}><Text style={styles.icon}>🏠</Text><Text style={styles.cardTitle}>{t('living')}</Text><Text style={styles.body}>{t('livingDescription')}</Text><AppButton onPress={() => navigation.navigate('Living')}>{t('manageLife').toUpperCase()}</AppButton></Card>
        <Card style={styles.card}><Text style={styles.icon}>♥</Text><Text style={styles.cardTitle}>{t('wellness')}</Text><Text style={styles.body}>{t('wellnessDescription')}</Text><AppButton variant="green" onPress={() => navigation.navigate('Wellness')}>{t('openWellness').toUpperCase()}</AppButton></Card>
        <Card style={styles.card}><Text style={styles.icon}>📊</Text><Text style={styles.cardTitle}>{t('budget')}</Text><Text style={styles.body}>{t('budgetDescription')}</Text><AppButton variant="green" onPress={() => navigation.navigate('Budget')}>{t('viewBudget').toUpperCase()}</AppButton></Card>
        <Card style={styles.card}><Text style={styles.icon}>🎰</Text><Text style={styles.cardTitle}>{t('casino')}</Text><Text style={styles.body}>{casinoUnlocked ? 'Table games, racing, and responsible loss limits are ready.' : `Current net worth $${formatBig(netWorth, 2)}. Build wealth to enter the entertainment district.`}</Text>{!casinoUnlocked ? <Text style={styles.unlock}>UNLOCK AT $25K</Text> : null}<AppButton variant={casinoUnlocked ? 'gold' : 'ghost'} onPress={() => navigation.navigate('Casino')}>{casinoUnlocked ? 'ENTER CASINO' : 'VIEW REQUIREMENTS'}</AppButton></Card>
        <Card style={styles.card}><Text style={styles.icon}>♛</Text><Text style={styles.cardTitle}>{t('profile')}</Text><Text style={styles.body}>{t('profileDescription')}</Text><AppButton variant="ghost" onPress={() => navigation.navigate('Profile')}>{t('openProfile').toUpperCase()}</AppButton></Card>
        {__DEV__ ? <Card style={styles.card}><Text style={styles.cardTitle}>Avatar Debug</Text><Text style={styles.body}>Inspect the shared canvas, anchors, layer order, and every appearance combination.</Text><AppButton variant="ghost" onPress={() => navigation.navigate('AvatarDebug')}>OPEN AVATAR DEBUG</AppButton></Card> : null}
      </ScrollView>
      <ActionDock active="more" />
    </Screen>
  );
}

const styles = StyleSheet.create({ content: { padding: 14, paddingBottom: 20 }, eyebrow: { color: colors.greenDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: 12 }, card: { marginBottom: 10 }, icon: { fontSize: 30 }, cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 5 }, body: { color: colors.muted, lineHeight: 17, fontSize: 11, marginVertical: 8 }, unlock: { alignSelf: 'flex-start', color: '#6F4A00', backgroundColor: '#FFD95C', borderRadius: 8, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontSize: 8, fontWeight: '900', marginBottom: 8 } });
