import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseEnabled, db } from './firebase';

// Firestore imports — only used when Firebase is configured
let firestoreDoc, firestoreSetDoc, firestoreGetDoc, firestoreUpdateDoc, serverTimestamp;
if (firebaseEnabled) {
  const fs = require('firebase/firestore');
  firestoreDoc        = fs.doc;
  firestoreSetDoc     = fs.setDoc;
  firestoreGetDoc     = fs.getDoc;
  firestoreUpdateDoc  = fs.updateDoc;
  serverTimestamp     = fs.serverTimestamp;
}

const KEYS = {
  QUIZ_ANSWERS:    'hg_quiz_answers',
  ANALYSIS_RESULT: 'hg_analysis_result',
  QUIZ_HISTORY:    'hg_quiz_history',
  SAVED_COLORS:    'hg_saved_colors',
  FRIENDS:         'hg_friends',
};

// ─────────────────────────────────────────────
// Quiz answers
// ─────────────────────────────────────────────

export async function saveQuizAnswersLocally(answers) {
  await AsyncStorage.setItem(KEYS.QUIZ_ANSWERS, JSON.stringify(answers));
}

export async function loadQuizAnswersLocally() {
  const raw = await AsyncStorage.getItem(KEYS.QUIZ_ANSWERS);
  return raw ? JSON.parse(raw) : null;
}

// ─────────────────────────────────────────────
// Analysis result — local cache + optional Firebase sync
// ─────────────────────────────────────────────

export async function saveResultLocally(result) {
  await AsyncStorage.setItem(KEYS.ANALYSIS_RESULT, JSON.stringify(result));

  // Append to local quiz history
  const history = await loadQuizHistoryLocally();
  history.unshift({ result, takenAt: new Date().toISOString() });
  await AsyncStorage.setItem(KEYS.QUIZ_HISTORY, JSON.stringify(history.slice(0, 10)));
}

export async function loadResultLocally() {
  const raw = await AsyncStorage.getItem(KEYS.ANALYSIS_RESULT);
  return raw ? JSON.parse(raw) : null;
}

export async function syncResultToFirebase(uid, answers, result) {
  if (!firebaseEnabled || !uid) return;
  try {
    const userRef = firestoreDoc(db, 'users', uid);
    const existing = await firestoreGetDoc(userRef);

    if (!existing.exists()) {
      await firestoreSetDoc(userRef, {
        quizAnswers: answers,
        analysisResult: result,
        quizHistory: [{ answers, result, takenAt: new Date().toISOString() }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        subscription: 'free',
      });
    } else {
      const data = existing.data();
      const history = data.quizHistory ?? [];
      history.push({ answers, result, takenAt: new Date().toISOString() });
      await firestoreUpdateDoc(userRef, {
        quizAnswers: answers,
        analysisResult: result,
        quizHistory: history.slice(-10),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Firebase sync failed (offline?):', err.message);
  }
}

export async function loadResultFromFirebase(uid) {
  if (!firebaseEnabled || !uid) return null;
  try {
    const snap = await firestoreGetDoc(firestoreDoc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Saved colors (keep/avoid from camera matcher)
// ─────────────────────────────────────────────

export async function getSavedColors() {
  const raw = await AsyncStorage.getItem(KEYS.SAVED_COLORS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveColor(uid, colorEntry) {
  const existing = await getSavedColors();
  const updated = [colorEntry, ...existing].slice(0, 200);
  await AsyncStorage.setItem(KEYS.SAVED_COLORS, JSON.stringify(updated));

  if (firebaseEnabled && uid) {
    try {
      await firestoreSetDoc(
        firestoreDoc(db, 'savedColors', `${uid}_${colorEntry.savedAt}`),
        { ...colorEntry, uid },
        { merge: true }
      );
    } catch {}
  }
}

export async function removeColor(savedAt) {
  const existing = await getSavedColors();
  const updated = existing.filter(c => c.savedAt !== savedAt);
  await AsyncStorage.setItem(KEYS.SAVED_COLORS, JSON.stringify(updated));
}

// ─────────────────────────────────────────────
// Quiz history
// ─────────────────────────────────────────────

export async function loadQuizHistoryLocally() {
  const raw = await AsyncStorage.getItem(KEYS.QUIZ_HISTORY);
  return raw ? JSON.parse(raw) : [];
}

// ─────────────────────────────────────────────
// Friends — stored locally
// friend: { id, name, subSeason, primarySeason, traits, addedAt }
// ─────────────────────────────────────────────

export async function getFriends() {
  const raw = await AsyncStorage.getItem(KEYS.FRIENDS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveFriend(friend) {
  const existing = await getFriends();
  // Overwrite if same id
  const others = existing.filter(f => f.id !== friend.id);
  const updated = [friend, ...others];
  await AsyncStorage.setItem(KEYS.FRIENDS, JSON.stringify(updated));
  return friend;
}

export async function removeFriend(id) {
  const existing = await getFriends();
  const updated = existing.filter(f => f.id !== id);
  await AsyncStorage.setItem(KEYS.FRIENDS, JSON.stringify(updated));
}
