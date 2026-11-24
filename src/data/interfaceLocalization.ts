import { translations, type Language, type TranslationKey } from './i18n';
import { EXTRA_INTERFACE_PHRASES } from './interfaceLocalizationExtra';

type LocalizedPhrase = Record<Exclude<Language, 'en'>, string>;

const phrase = (
  tr: string,
  es: string,
  zh: string,
  de: string,
  ru: string,
  fr: string,
  hi: string,
): LocalizedPhrase => ({ tr, es, zh, de, ru, fr, hi });

/**
 * Text that predates the keyed translation catalogue. Keeping this bridge in one
 * place lets every existing screen react to language changes while the UI copy
 * is gradually moved to explicit translation keys.
 */
const UI_PHRASES: Record<string, LocalizedPhrase> = {
  'Create your look': phrase('Görünümünü oluştur', 'Crea tu aspecto', '创建你的形象', 'Erstelle deinen Look', 'Создайте свой образ', 'Créez votre look', 'अपना रूप बनाएँ'),
  'Everyone starts equally: homeless, unemployed, and ready to build a life.': phrase('Herkes eşit başlar: evsiz, işsiz ve hayat kurmaya hazır.', 'Todos empiezan igual: sin hogar, sin empleo y listos para construir una vida.', '每个人都从同一起点开始：无家可归、失业，并准备建立新生活。', 'Alle beginnen gleich: obdachlos, arbeitslos und bereit, ein Leben aufzubauen.', 'Все начинают одинаково: без дома, без работы и готовы построить жизнь.', 'Tout le monde commence à égalité : sans logement, sans emploi et prêt à construire sa vie.', 'हर कोई समान रूप से शुरू करता है: बेघर, बेरोज़गार और जीवन बनाने के लिए तैयार।'),
  'Your name': phrase('Adın', 'Tu nombre', '你的名字', 'Dein Name', 'Ваше имя', 'Votre nom', 'आपका नाम'),
  'Body type': phrase('Vücut tipi', 'Tipo de cuerpo', '体型', 'Körpertyp', 'Тип тела', 'Type de corps', 'शरीर का प्रकार'),
  'Ethnicity': phrase('Etnik köken', 'Origen étnico', '族裔', 'Ethnische Herkunft', 'Этническая принадлежность', 'Origine ethnique', 'जातीयता'),
  'Skin tone': phrase('Cilt tonu', 'Tono de piel', '肤色', 'Hautton', 'Тон кожи', 'Teint', 'त्वचा का रंग'),
  'Hairstyle': phrase('Saç stili', 'Peinado', '发型', 'Frisur', 'Причёска', 'Coiffure', 'बालों की शैली'),
  'Male': phrase('Erkek', 'Hombre', '男性', 'Männlich', 'Мужской', 'Homme', 'पुरुष'),
  'Female': phrase('Kadın', 'Mujer', '女性', 'Weiblich', 'Женский', 'Femme', 'महिला'),
  'Current paycheck': phrase('Mevcut maaş', 'Sueldo actual', '当前工资', 'Aktuelles Gehalt', 'Текущая зарплата', 'Salaire actuel', 'वर्तमान वेतन'),
  'Payday in': phrase('Maaşa kalan', 'Día de pago en', '距离发薪', 'Zahltag in', 'До зарплаты', 'Paie dans', 'वेतन मिलने में'),
  'You are unemployed': phrase('İşsizsin', 'Estás desempleado', '你目前失业', 'Du bist arbeitslos', 'Вы безработный', 'Vous êtes sans emploi', 'आप बेरोज़गार हैं'),
  'Choose an entry-level job or meet the checklist for a better career.': phrase('Başlangıç işi seç veya daha iyi bir kariyer için koşulları tamamla.', 'Elige un trabajo inicial o cumple los requisitos para una carrera mejor.', '选择入门工作，或满足条件以获得更好的职业。', 'Wähle einen Einstiegsjob oder erfülle die Voraussetzungen für eine bessere Karriere.', 'Выберите стартовую работу или выполните условия для лучшей карьеры.', 'Choisissez un emploi débutant ou remplissez les conditions pour une meilleure carrière.', 'शुरुआती नौकरी चुनें या बेहतर करियर की शर्तें पूरी करें।'),
  'Job interviews': phrase('İş görüşmeleri', 'Entrevistas de trabajo', '工作面试', 'Vorstellungsgespräche', 'Собеседования', "Entretiens d'embauche", 'नौकरी के साक्षात्कार'),
  'Attend interview': phrase('Görüşmeye katıl', 'Asistir a la entrevista', '参加面试', 'Zum Gespräch', 'Пройти собеседование', "Passer l'entretien", 'साक्षात्कार दें'),
  'Education center': phrase('Eğitim merkezi', 'Centro educativo', '教育中心', 'Bildungszentrum', 'Учебный центр', "Centre d'éducation", 'शिक्षा केंद्र'),
  'Available courses': phrase('Mevcut kurslar', 'Cursos disponibles', '可选课程', 'Verfügbare Kurse', 'Доступные курсы', 'Cours disponibles', 'उपलब्ध पाठ्यक्रम'),
  'Current course': phrase('Mevcut kurs', 'Curso actual', '当前课程', 'Aktueller Kurs', 'Текущий курс', 'Cours actuel', 'वर्तमान पाठ्यक्रम'),
  'Enroll': phrase('Kaydol', 'Inscribirse', '报名', 'Einschreiben', 'Записаться', "S'inscrire", 'नामांकन करें'),
  'Requirements': phrase('Gereksinimler', 'Requisitos', '要求', 'Voraussetzungen', 'Требования', 'Conditions', 'आवश्यकताएँ'),
  'Monthly income': phrase('Aylık gelir', 'Ingresos mensuales', '月收入', 'Monatliches Einkommen', 'Месячный доход', 'Revenu mensuel', 'मासिक आय'),
  'Month': phrase('Ay', 'Mes', '月', 'Monat', 'Месяц', 'Mois', 'महीना'),
  'Monthly costs': phrase('Aylık giderler', 'Gastos mensuales', '月支出', 'Monatliche Kosten', 'Месячные расходы', 'Dépenses mensuelles', 'मासिक खर्च'),
  'Monthly result': phrase('Aylık sonuç', 'Resultado mensual', '月度结果', 'Monatsergebnis', 'Итог за месяц', 'Résultat mensuel', 'मासिक परिणाम'),
  'Monthly profit': phrase('Aylık kâr', 'Beneficio mensual', '月利润', 'Monatsgewinn', 'Месячная прибыль', 'Bénéfice mensuel', 'मासिक लाभ'),
  'Income earned': phrase('Kazanılan gelir', 'Ingresos obtenidos', '获得收入', 'Erzieltes Einkommen', 'Полученный доход', 'Revenus gagnés', 'अर्जित आय'),
  'Expenses paid': phrase('Ödenen giderler', 'Gastos pagados', '已付支出', 'Bezahlte Ausgaben', 'Оплаченные расходы', 'Dépenses payées', 'भुगतान किए खर्च'),
  'Business profit': phrase('İşletme kârı', 'Beneficio empresarial', '企业利润', 'Unternehmensgewinn', 'Прибыль бизнеса', "Bénéfice d'entreprise", 'व्यवसाय लाभ'),
  'Build your empire': phrase('İmparatorluğunu kur', 'Construye tu imperio', '建立你的帝国', 'Baue dein Imperium', 'Постройте свою империю', 'Bâtissez votre empire', 'अपना साम्राज्य बनाएँ'),
  'Employees': phrase('Çalışanlar', 'Empleados', '员工', 'Mitarbeiter', 'Сотрудники', 'Employés', 'कर्मचारी'),
  'Valuation': phrase('Değerleme', 'Valoración', '估值', 'Bewertung', 'Оценка', 'Valorisation', 'मूल्यांकन'),
  'Hire': phrase('İşe al', 'Contratar', '雇用', 'Einstellen', 'Нанять', 'Embaucher', 'नियुक्त करें'),
  'Fire last': phrase('Son çalışanı çıkar', 'Despedir al último', '解雇最后一人', 'Letzten entlassen', 'Уволить последнего', 'Licencier le dernier', 'अंतिम को हटाएँ'),
  'Upgrades': phrase('Yükseltmeler', 'Mejoras', '升级', 'Verbesserungen', 'Улучшения', 'Améliorations', 'उन्नयन'),
  'Marketing': phrase('Pazarlama', 'Marketing', '营销', 'Marketing', 'Маркетинг', 'Marketing', 'मार्केटिंग'),
  'Equipment': phrase('Ekipman', 'Equipo', '设备', 'Ausrüstung', 'Оборудование', 'Équipement', 'उपकरण'),
  'Location': phrase('Konum', 'Ubicación', '地点', 'Standort', 'Местоположение', 'Emplacement', 'स्थान'),
  'Sell': phrase('Sat', 'Vender', '出售', 'Verkaufen', 'Продать', 'Vendre', 'बेचें'),
  'Portfolio': phrase('Portföy', 'Cartera', '投资组合', 'Portfolio', 'Портфель', 'Portefeuille', 'पोर्टफोलियो'),
  'Open orders': phrase('Açık emirler', 'Órdenes abiertas', '未结订单', 'Offene Aufträge', 'Открытые ордера', 'Ordres ouverts', 'खुले ऑर्डर'),
  'Relationships': phrase('İlişkiler', 'Relaciones', '人际关系', 'Beziehungen', 'Отношения', 'Relations', 'रिश्ते'),
  'Partner happiness': phrase('Partner mutluluğu', 'Felicidad de la pareja', '伴侣幸福度', 'Partnerglück', 'Счастье партнёра', 'Bonheur du partenaire', 'साथी की खुशी'),
  'Daily missions': phrase('Günlük görevler', 'Misiones diarias', '每日任务', 'Tägliche Missionen', 'Ежедневные задания', 'Missions quotidiennes', 'दैनिक मिशन'),
  'Daily reward': phrase('Günlük ödül', 'Recompensa diaria', '每日奖励', 'Tägliche Belohnung', 'Ежедневная награда', 'Récompense quotidienne', 'दैनिक पुरस्कार'),
  'Achievements': phrase('Başarımlar', 'Logros', '成就', 'Erfolge', 'Достижения', 'Succès', 'उपलब्धियाँ'),
  'Legacy points': phrase('Miras puanları', 'Puntos de legado', '传承点数', 'Vermächtnispunkte', 'Очки наследия', 'Points de prestige', 'विरासत अंक'),
  'How it works': phrase('Nasıl çalışır', 'Cómo funciona', '工作原理', 'So funktioniert es', 'Как это работает', 'Comment ça marche', 'यह कैसे काम करता है'),
  'Available cash': phrase('Kullanılabilir nakit', 'Dinero disponible', '可用现金', 'Verfügbares Bargeld', 'Доступные деньги', 'Argent disponible', 'उपलब्ध नकद'),
  'Game data': phrase('Oyun verileri', 'Datos del juego', '游戏数据', 'Spieldaten', 'Данные игры', 'Données du jeu', 'गेम डेटा'),
  'Legal & support': phrase('Yasal ve destek', 'Legal y soporte', '法律与支持', 'Rechtliches & Support', 'Правовая информация и поддержка', 'Mentions légales et assistance', 'कानूनी और सहायता'),
  'Back': phrase('Geri', 'Atrás', '返回', 'Zurück', 'Назад', 'Retour', 'वापस'),
  'Continue': phrase('Devam et', 'Continuar', '继续', 'Weiter', 'Продолжить', 'Continuer', 'जारी रखें'),
  'Buy': phrase('Satın al', 'Comprar', '购买', 'Kaufen', 'Купить', 'Acheter', 'खरीदें'),
  'Owned': phrase('Sahip', 'Adquirido', '已拥有', 'Im Besitz', 'Куплено', 'Possédé', 'खरीदा हुआ'),
  'Claim': phrase('Al', 'Reclamar', '领取', 'Abholen', 'Получить', 'Réclamer', 'प्राप्त करें'),
  'Locked': phrase('Kilitli', 'Bloqueado', '已锁定', 'Gesperrt', 'Заблокировано', 'Verrouillé', 'लॉक'),
  'Level': phrase('Seviye', 'Nivel', '等级', 'Stufe', 'Уровень', 'Niveau', 'स्तर'),
  'Experience': phrase('Deneyim', 'Experiencia', '经验', 'Erfahrung', 'Опыт', 'Expérience', 'अनुभव'),
  'Age': phrase('Yaş', 'Edad', '年龄', 'Alter', 'Возраст', 'Âge', 'उम्र'),
  'Energy': phrase('Enerji', 'Energía', '精力', 'Energie', 'Энергия', 'Énergie', 'ऊर्जा'),
  'Health': phrase('Sağlık', 'Salud', '健康', 'Gesundheit', 'Здоровье', 'Santé', 'स्वास्थ्य'),
  'Happiness': phrase('Mutluluk', 'Felicidad', '幸福', 'Glück', 'Счастье', 'Bonheur', 'ख़ुशी'),
  'Income': phrase('Gelir', 'Ingresos', '收入', 'Einkommen', 'Доход', 'Revenus', 'आय'),
  'Cash': phrase('Nakit', 'Dinero', '现金', 'Bargeld', 'Деньги', 'Argent', 'नकद'),
  'Businesses': phrase('İşletmeler', 'Negocios', '企业', 'Unternehmen', 'Бизнесы', 'Entreprises', 'व्यवसाय'),
  'Dividends': phrase('Temettüler', 'Dividendos', '股息', 'Dividenden', 'Дивиденды', 'Dividendes', 'लाभांश'),
  'Later': phrase('Daha sonra', 'Más tarde', '稍后', 'Später', 'Позже', 'Plus tard', 'बाद में'),
};

const keyedEnglish = Object.entries(translations.en) as [TranslationKey, string][];
const keyedByEnglish = new Map(keyedEnglish.map(([key, english]) => [english.toLocaleLowerCase('en-US'), key]));
const allInterfacePhrases = { ...UI_PHRASES, ...EXTRA_INTERFACE_PHRASES };
const phraseByEnglish = new Map(Object.entries(allInterfacePhrases).map(([english, localized]) => [english.toLocaleLowerCase('en-US'), localized]));
const dynamicFragments = ['net worth', 'per second', 'per sec', 'Experience', 'Level', 'Month', 'Age'];
const fragmentPatterns = dynamicFragments
  .map((english) => ({ english, pattern: new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi') }));
const embeddedPhrasePatterns = Object.keys(EXTRA_INTERFACE_PHRASES)
  .sort((left, right) => right.length - left.length)
  .map((english) => ({
    english,
    pattern: new RegExp(`(?<![\\p{L}])${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'giu'),
  }));

function preserveCase(source: string, translated: string, language: Language): string {
  const letters = source.replace(/[^\p{L}]/gu, '');
  if (letters.length > 1 && letters === letters.toLocaleUpperCase('en-US')) {
    return translated.toLocaleUpperCase(language === 'tr' ? 'tr-TR' : undefined);
  }
  return translated;
}

function lookupExact(language: Exclude<Language, 'en'>, value: string): string | undefined {
  const normalized = value.trim().toLocaleLowerCase('en-US');
  const key = keyedByEnglish.get(normalized);
  if (key) return preserveCase(value, translations[language][key], language);
  const localized = phraseByEnglish.get(normalized);
  return localized ? preserveCase(value, localized[language], language) : undefined;
}

/** Localizes legacy visible strings while leaving player-entered and unknown data untouched. */
export function localizeInterfaceText(language: Language, value: string): string {
  if (language === 'en' || value.trim().length === 0) return value;
  const prefix = value.match(/^\s*/u)?.[0] ?? '';
  const suffix = value.match(/\s*$/u)?.[0] ?? '';
  const core = value.slice(prefix.length, value.length - suffix.length || undefined);
  const exact = lookupExact(language, core);
  if (exact) return `${prefix}${exact}${suffix}`;

  // Dynamic labels such as "AGE 18" and "Level 4" retain their values.
  let result = core;
  for (const { english, pattern } of embeddedPhrasePatterns) {
    const replacement = lookupExact(language, english);
    if (!replacement) continue;
    result = result.replace(pattern, (match) => preserveCase(match, replacement, language));
  }
  for (const { english, pattern } of fragmentPatterns) {
    const replacement = lookupExact(language, english);
    if (!replacement) continue;
    result = result.replace(pattern, (match) => preserveCase(match, replacement, language));
  }
  return `${prefix}${result}${suffix}`;
}
