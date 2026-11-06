import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { LifeHeader } from '../components/LifeHeader';
import { Screen } from '../components/Screen';
import { formatBig } from '../game/BigNumber';
import { loanOfferFor, monthlyBillsFor, monthlyIncomeBreakdown, useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';

export function BudgetScreen() {
  const state = useLifeStore();
  const bills = monthlyBillsFor(state);
  const income = monthlyIncomeBreakdown(state);
  const monthlyIncome = income.total;
  const monthlyExpenses = bills.total + state.lateFees;
  const max = Math.max(1, monthlyIncome, bills.total);
  const last = state.monthlyBudgets[state.monthlyBudgets.length - 1];
  const loanOffer = loanOfferFor(state);
  const borrowAmount = Math.min(5_000, loanOffer.maxAmount);
  return <Screen><LifeHeader /><ScrollView contentContainerStyle={styles.content}><Text style={styles.eyebrow}>FINANCIAL CONTROL</Text><Text style={styles.title}>Monthly Budget</Text><Card><View style={styles.barRow}><Text style={styles.barLabel}>Projected total income</Text><View style={styles.track}><View style={[styles.incomeBar, { width: `${monthlyIncome / max * 100}%` }]} /></View><Text style={styles.amount}>${formatBig(monthlyIncome)}</Text></View><View style={styles.line}><Text style={styles.lineName}>Job salary</Text><Text style={styles.lineValue}>${formatBig(income.salary)}</Text></View><View style={styles.line}><Text style={styles.lineName}>Business profit</Text><Text style={styles.lineValue}>${formatBig(income.business)}</Text></View><View style={styles.line}><Text style={styles.lineName}>Partner income</Text><Text style={styles.lineValue}>${formatBig(income.partner)}</Text></View><View style={styles.line}><Text style={styles.lineName}>Passive bonuses</Text><Text style={styles.lineValue}>${formatBig(income.passiveBonus)}</Text></View><View style={styles.barRow}><Text style={styles.barLabel}>Bills and late balance</Text><View style={styles.track}><View style={[styles.expenseBar, { width: `${monthlyExpenses / Math.max(max, monthlyExpenses) * 100}%` }]} /></View><Text style={styles.amount}>${formatBig(monthlyExpenses)}</Text></View><View style={styles.divider} /><Text style={monthlyIncome >= monthlyExpenses ? styles.surplus : styles.deficit}>{monthlyIncome >= monthlyExpenses ? 'SURPLUS' : 'DEFICIT'} · ${formatBig(Math.abs(monthlyIncome - monthlyExpenses))}</Text></Card><Text style={styles.section}>NEXT BILL BREAKDOWN</Text><Card>{bills.lines.map((line) => <View key={line.id} style={styles.line}><Text style={styles.lineName}>{line.label}</Text><Text style={styles.lineValue}>${formatBig(line.amount)}</Text></View>)}<View style={styles.divider} /><View style={styles.line}><Text style={styles.total}>TOTAL</Text><Text style={styles.total}>${formatBig(bills.total)}</Text></View>{state.lateFees > 0 ? <Text style={styles.warning}>Late balance next month: ${formatBig(state.lateFees)}</Text> : null}</Card><Text style={styles.section}>BANK LOANS</Text><Card><Text style={styles.body}>{loanOffer.eligible ? `Available credit: $${formatBig(loanOffer.maxAmount)} · ${Math.round(loanOffer.annualRate * 100)}% APR · ${loanOffer.termMonths} months. Total loan payments cannot exceed 25% of job salary.` : loanOffer.reason}</Text><AppButton disabled={!loanOffer.eligible || borrowAmount < 500} onPress={() => state.takeLoan(borrowAmount)}>{loanOffer.eligible ? `BORROW $${formatBig(borrowAmount)}` : 'LOAN UNAVAILABLE'}</AppButton>{state.loans.map((loan) => <View key={loan.id} style={styles.loan}><Text style={styles.lineName}>Loan · {Math.round(loan.annualRate * 100)}% APR</Text><Text style={styles.lineValue}>${formatBig(loan.balance)} · ${formatBig(loan.monthlyPayment)}/mo</Text></View>)}</Card><Text style={styles.section}>12-MONTH HISTORY</Text>{state.monthlyBudgets.length === 0 ? <Card><Text style={styles.body}>Your first statement arrives when the current game month ends.</Text></Card> : state.monthlyBudgets.map((month) => <View key={month.month} style={styles.history}><Text style={styles.month}>MONTH {month.month}</Text><Text style={styles.historyIncome}>+${formatBig(month.income)}</Text><Text style={styles.historyExpense}>-${formatBig(month.expenses)}</Text></View>)}{last?.unpaid && last.unpaid > 0 ? <Text style={styles.warning}>Your last statement had ${formatBig(last.unpaid)} unpaid.</Text> : null}</ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 80 },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', marginBottom: 13 },
  barRow: { marginBottom: 12 },
  barLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 },
  track: { height: 13, backgroundColor: colors.surface2, overflow: 'hidden', borderRadius: 8 },
  incomeBar: { height: '100%', backgroundColor: colors.green },
  expenseBar: { height: '100%', backgroundColor: colors.danger },
  amount: { color: colors.text, fontSize: 11, fontWeight: '900', marginTop: 3, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  surplus: { color: colors.green, fontWeight: '900', textAlign: 'center' },
  deficit: { color: colors.danger, fontWeight: '900', textAlign: 'center' },
  section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginTop: 22, marginBottom: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  lineName: { color: colors.text, fontSize: 11, flex: 1 },
  lineValue: { color: colors.gold, fontSize: 11, fontWeight: '800' },
  total: { color: colors.text, fontWeight: '900' },
  warning: { color: colors.danger, fontSize: 11, fontWeight: '800', marginTop: 9 },
  body: { color: colors.muted, lineHeight: 18, fontSize: 11, marginBottom: 10 },
  loan: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 11, paddingTop: 10, flexDirection: 'row' },
  history: { backgroundColor: colors.surface, borderRadius: 10, padding: 11, flexDirection: 'row', marginBottom: 5 },
  month: { color: colors.muted, flex: 1, fontSize: 9, fontWeight: '900' },
  historyIncome: { color: colors.green, width: 90, textAlign: 'right', fontSize: 10 },
  historyExpense: { color: colors.danger, width: 90, textAlign: 'right', fontSize: 10 },
});
