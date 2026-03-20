import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const KEYS = {
  QUIZ_ANSWERS: 'hg_quiz_answers',
  ANALYSIS_RESULT: 'hg_analysis_result',
  QUIZ_HISTORY: 'hg_quiz_history',
  SAVED_COLORS: 'hg_saved_colors',
};

// ─────────────────────────────────────────────
// Quiz answers — saved locally as user goes through quiz
// so progress is never lost
// ─────────────────────────────────────────────

export async function saveQuizAnswersLocally(answers) {
  await AsyncStorage.setItem(KEYS.QUIZ_ANSWERS, JSON.stringify(answers));
}

export async function loadQuizAnswersLocally() {
  const raw = await AsyncStorage.getItem(KEYS.QUIZ_ANSWERS);
  return raw ? JSON.parse(raw) : null;
}

// ─────────────────────────────────────────────
// Analysis result — local cache + Firebase sync
// ─────────────────────────────────────────────

export async function saveResultLocally(result) {
  await AsyncStorage.setItem(KEYS.ANALYSIS_RESULT, JSON.stringify(result));
}

export async function loadResultLocally() {
  const raw = await AsyncStorage.getItem(KEYS.ANALYSIS_RESULT);
  return raw ? JSON.parse(raw) : null;
}

export async function syncResultToFirebase(uid, answers, result) {
  try {
    const userRef = doc(db, 'users', uid);
    const existing = await getDoc(userRef);

    if (!existing.exists()) {
      // First-time save
      await setDoc(userRef, {
        quizAnswers: answers,
        analysisResult: result,
        quizHistory: [{ answers, result, takenAt: new Date().toISOString() }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        subscription: 'free',
      });
    } else {
      // Update existing — append to history
      const data = existing.data();
      const history = data.quizHistory ?? [];
      history.push({ answers, result, takenAt: new Date().toISOString() });

      await updateDoc(userRef, {
        quizAnswers: answers,
        analysisResult: result,
        quizHistory: history.slice(-10), // keep last 10 attempts
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Firebase sync failed (offline?), result saved locally:', err.message);
  }
}

export async function loadResultFromFirebase(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
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
  // colorEntry: { hex, name, rating, verdict, savedAt }
  const existing = await getSavedColors();
  const updated = [colorEntry, ...existing].slice(0, 200); // cap at 200
  await AsyncStorage.setItem(KEYS.SAVED_COLORS, JSON.stringify(updated));

  // Sync to Firebase if online
  if (uid) {
    try {
      await setDoc(
        doc(db, 'savedColors', `${uid}_${colorEntry.savedAt}`),
        { ...colorEntry, uid },
        { merge: true }
      );
    } catch {
      // silently fail — already saved locally
    }
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
