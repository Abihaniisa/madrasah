export type CurriculumEntry = {
  overview: string;
  semester1: Record<string, string[]>;
  semester2: Record<string, string[]>;
};

const SUBJECTS = ["Qur'an", "Tajweed", "Hadith", "Fiqh", "Arabic"];

function blank(): { semester1: Record<string, string[]>; semester2: Record<string, string[]> } {
  const s1: Record<string, string[]> = {};
  const s2: Record<string, string[]> = {};
  for (const s of SUBJECTS) {
    s1[s] = Array.from({ length: 20 }, (_, i) => `Week ${i + 1}`);
    s2[s] = Array.from({ length: 20 }, (_, i) => `Week ${i + 1}`);
  }
  return { semester1: s1, semester2: s2 };
}

const T1_QURAN_S1 = [
  "An-Nas (114), Al-Falaq (113), Al-Ikhlas (112), Al-Masad (111)",
  "An-Nasr (110), Al-Kafirun (109), Al-Kawthar (108)",
  "Al-Ma'un (107), Quraysh (106), Al-Fil (105)",
  "Al-Humazah (104), Al-'Asr (103), At-Takathur (102)",
  "Al-Qari'ah (101), Al-'Adiyat (100), Az-Zalzalah (99)",
  "Al-Bayyinah (98), Al-Qadr (97), Al-'Alaq (96)",
  "At-Tin (95), Ash-Sharh (94), Ad-Duha (93)",
  "Al-Layl (92), Ash-Shams (91), Al-Balad (90)",
  "Al-Fajr (89), Al-Ghashiyah (88), Al-A'la (87)",
  "At-Tariq (86), Al-Buruj (85), Al-Inshiqaq (84)",
  "Al-Mutaffifin (83), Al-Infitar (82), At-Takwir (81)",
  "'Abasa (80), An-Nazi'at (79), An-Naba (78)",
  "Al-Mursalat (77), Al-Insan (76)",
  "Al-Qiyamah (75), Al-Muddaththir (74)",
  "Al-Muzzammil (73), Al-Jinn (72)",
  "Nuh (71), Al-Ma'arij (70)",
  "Al-Haqqah (69), Al-Qalam (68)",
  "Al-Mulk (67), At-Tahrim (66)",
  "At-Talaq (65), At-Taghabun (64)",
  "Al-Munafiqun (63), Al-Jumu'ah (62)",
];

const T1_QURAN_S2 = [
  "As-Saff (61), Al-Mumtahanah (60)",
  "Al-Hashr (59)",
  "Al-Mujadilah (58)",
  "Al-Mujadilah (58) continued",
  "Al-Hadid (57)",
  "Al-Waqi'ah (56)",
  "Al-Waqi'ah (56) continued",
  "Ar-Rahman (55)",
  "Al-Qamar (54)",
  "An-Najm (53)",
  "At-Tur (52)",
  "Adh-Dhariyat (51)",
  "Qaf (50)",
  "Al-Hujurat (49)",
  "Al-Hujurat (49) continued",
  "Al-Fath (48)",
  "Muhammad (47)",
  "Muhammad (47) continued",
  "Al-Ahqaf (46)",
  "Al-Ahqaf (46) continued",
];

const t1 = blank();
t1.semester1["Qur'an"] = T1_QURAN_S1;
t1.semester2["Qur'an"] = T1_QURAN_S2;

export const CURRICULUM: Record<string, CurriculumEntry> = {
  "Tamhid": {
    overview: "3 Hizb Qur'an · Miftahul Arabiyyah · Hisnul Muslim (selected)",
    ...blank(),
  },
  "I'idad": {
    overview: "3 Hizb Qur'an (Juz 30) · Heavy Miftahul Arabiyyah · Khamsuna Hadith",
    ...blank(),
  },
  "Thanawiyyah 1": {
    overview: "9 Hizb Qur'an · Al-Ashmawiyyah · Miatu Hadith · Nahw al-Wadih Primary 1 · Tajweed",
    ...t1,
  },
  "Thanawiyyah 2": {
    overview: "9 Hizb Qur'an · Al-Akhdari · An-Nawawi's Forty · Nahw al-Wadih Primary 2 · Tajweed",
    ...blank(),
  },
  "Thanawiyyah 3": {
    overview: "9 Hizb Qur'an · Risalah (1st) · Umdatul Ahkam (1st) · Nahw al-Wadih Primary 3 · Tajweed",
    ...blank(),
  },
  "Thanawiyyah 4": {
    overview: "9 Hizb Qur'an · Risalah (2nd) · Umdatul Ahkam (2nd) · Nahw al-Wadih Secondary 1 · Tajweed",
    ...blank(),
  },
  "Thanawiyyah 5": {
    overview: "9 Hizb Qur'an · Risalah (3rd) · Umdatul Ahkam (3rd) · Nahw al-Wadih Secondary 2 · Tajweed",
    ...blank(),
  },
  "Thanawiyyah 6": {
    overview: "9 Hizb Qur'an · Risalah revision · Umdatul Ahkam revision · Nahw al-Wadih Secondary 3 · Tajweed",
    ...blank(),
  },
};
