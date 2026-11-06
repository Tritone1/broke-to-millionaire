import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  deleteBackendAccount,
  ensureGuestSession,
  isBackendConfigured,
  linkGuestToEmail,
  signInWithEmail,
  signOutBackend,
} from '../services/backend';
import { colors } from '../theme';
import { AppButton } from './AppButton';
import { Card } from './Card';

type AccountState = 'loading' | 'unconfigured' | 'guest' | 'protected' | 'error';

export function CloudAccountCard() {
  const [accountState, setAccountState] = useState<AccountState>(isBackendConfigured ? 'loading' : 'unconfigured');
  const [accountEmail, setAccountEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInMode, setSignInMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    try {
      const result = await ensureGuestSession();
      if (result.status === 'unconfigured') {
        setAccountState('unconfigured');
        return;
      }
      setAccountEmail(result.user.email ?? '');
      setAccountState(result.user.is_anonymous ? 'guest' : 'protected');
    } catch {
      setAccountState('error');
      setMessage('Cloud account service is temporarily unavailable. Your local save is safe.');
    }
  };

  useEffect(() => {
    let active = true;
    void ensureGuestSession()
      .then((result) => {
        if (!active) return;
        if (result.status === 'unconfigured') {
          setAccountState('unconfigured');
          return;
        }
        setAccountEmail(result.user.email ?? '');
        setAccountState(result.user.is_anonymous ? 'guest' : 'protected');
      })
      .catch(() => {
        if (!active) return;
        setAccountState('error');
        setMessage('Cloud account service is temporarily unavailable. Your local save is safe.');
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async () => {
    setBusy(true);
    setMessage('');
    try {
      if (signInMode) {
        await signInWithEmail(email, password);
        setMessage('Signed in. This device is connected to your protected account.');
      } else {
        await linkGuestToEmail(email, password);
        setMessage('Account protection added. Check your email if confirmation is required.');
      }
      setPassword('');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The account request failed.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await signOutBackend();
      setEmail('');
      setPassword('');
      setMessage('Signed out. A new guest account is active on this device.');
      await refresh();
    } catch {
      setMessage('Sign-out failed. Please try again while online.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => Alert.alert(
    'Delete cloud account?',
    'This permanently deletes the cloud profile, wallet history, and cloud save. The save stored on this device remains until you use Reset Save.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete account',
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          void deleteBackendAccount()
            .then(async () => {
              setMessage('Cloud account deleted. A new guest account is active.');
              await refresh();
            })
            .catch(() => setMessage('Account deletion failed. Please try again while online.'))
            .finally(() => setBusy(false));
        },
      },
    ],
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>CLOUD ACCOUNT</Text>
      {accountState === 'unconfigured' ? (
        <>
          <Text style={styles.status}>Not connected</Text>
          <Text style={styles.body}>Local saving works. Cloud accounts, verified rewards, and purchases become available after the production backend is connected.</Text>
        </>
      ) : accountState === 'loading' ? (
        <Text style={styles.body}>Connecting securely…</Text>
      ) : (
        <>
          <Text style={styles.status}>{accountState === 'guest' ? 'Guest account' : accountState === 'protected' ? accountEmail || 'Protected account' : 'Connection problem'}</Text>
          <Text style={styles.body}>{accountState === 'guest' ? 'Protect this guest account before spending real money, or sign in to an existing account.' : 'Your player identity is protected by email and password.'}</Text>
          {accountState === 'guest' ? (
            <>
              <View style={styles.modeRow}>
                <AppButton style={styles.modeButton} variant={!signInMode ? 'green' : 'ghost'} onPress={() => setSignInMode(false)}>PROTECT GUEST</AppButton>
                <AppButton style={styles.modeButton} variant={signInMode ? 'green' : 'ghost'} onPress={() => setSignInMode(true)}>SIGN IN</AppButton>
              </View>
              <TextInput
                accessibilityLabel="Account email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={email}
              />
              <TextInput
                accessibilityLabel="Account password"
                autoCapitalize="none"
                autoComplete="password"
                onChangeText={setPassword}
                placeholder="Password (8+ characters)"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={styles.input}
                value={password}
              />
              <AppButton disabled={busy || !email.trim() || password.length < 8} onPress={() => void submit()}>{busy ? 'PLEASE WAIT' : signInMode ? 'SIGN IN SECURELY' : 'PROTECT ACCOUNT'}</AppButton>
            </>
          ) : accountState === 'protected' ? (
            <>
              <AppButton disabled={busy} style={styles.action} variant="ghost" onPress={() => void signOut()}>SIGN OUT</AppButton>
              <AppButton disabled={busy} style={styles.action} variant="danger" onPress={confirmDelete}>DELETE CLOUD ACCOUNT</AppButton>
            </>
          ) : null}
          {!!message && <Text style={styles.message}>{message}</Text>}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: colors.greenDark },
  title: { color: colors.greenDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  status: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 6 },
  body: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  modeButton: { flex: 1, minHeight: 40, paddingHorizontal: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 13, marginTop: 9, fontSize: 14 },
  action: { marginTop: 9 },
  message: { color: colors.greenDark, fontSize: 11, lineHeight: 16, marginTop: 10, fontWeight: '700' },
});
