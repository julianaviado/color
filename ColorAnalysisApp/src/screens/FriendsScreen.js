import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getFriends, saveFriend, removeFriend } from '../utils/storage';
import { SEASON_PROFILES } from '../data/seasons';
import { SEASON_ACCENT_COLORS, SEASON_GRADIENTS, COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';
import SeasonBadge from '../components/SeasonBadge';

const ALL_SEASONS = Object.keys(SEASON_PROFILES);
const FAMILIES = ['Autumn', 'Spring', 'Summer', 'Winter'];
const SEASONS_BY_FAMILY = FAMILIES.reduce((acc, fam) => {
  acc[fam] = ALL_SEASONS.filter(s => SEASON_PROFILES[s].family === fam);
  return acc;
}, {});

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getFriends().then(setFriends);
    }, [])
  );

  async function handleRemove(id, name) {
    Alert.alert(
      `Remove ${name}?`,
      'Their colour profile will be removed from your list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFriend(id);
            setFriends(f => f.filter(fr => fr.id !== id));
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Friends</Text>
          <Text style={styles.headerSub}>Shop for the people you love</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {friends.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          friends.map(friend => (
            <FriendCard
              key={friend.id}
              friend={friend}
              onShop={() => navigation.navigate('ColorMatch', { result: friend })}
              onRemove={() => handleRemove(friend.id, friend.name)}
            />
          ))
        )}
      </ScrollView>

      <AddFriendModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={async (friend) => {
          await saveFriend(friend);
          setFriends(f => [friend, ...f.filter(fr => fr.id !== friend.id)]);
          setShowAdd(false);
        }}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Friend card
// ─────────────────────────────────────────────

function FriendCard({ friend, onShop, onRemove }) {
  const accentColor = SEASON_ACCENT_COLORS[friend.subSeason] ?? COLORS.accent;
  const gradients   = SEASON_GRADIENTS[friend.primarySeason] ?? ['#FAF8F5', '#F0EAE4'];
  const seasonData  = SEASON_PROFILES[friend.subSeason] ?? {};
  const palette     = (seasonData.palette ?? []).slice(0, 6);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[gradients[0], '#FAF8F5']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Name + season */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: accentColor + '30' }]}>
            <Text style={[styles.avatarLetter, { color: accentColor }]}>
              {friend.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.friendName}>{friend.name}</Text>
            <Text style={[styles.friendSeason, { color: accentColor }]}>
              {friend.subSeason}
            </Text>
          </View>
          <SeasonBadge subSeason={friend.subSeason} family={friend.primarySeason} small />
        </View>

        {/* Palette swatches */}
        {palette.length > 0 && (
          <View style={styles.paletteRow}>
            {palette.map((sw, i) => (
              <View key={sw.hex + i} style={[styles.paletteSwatch, { backgroundColor: sw.hex }]} />
            ))}
          </View>
        )}

        {/* Traits row */}
        {friend.traits && (
          <View style={styles.traitRow}>
            {[
              friend.traits.temperature?.label,
              friend.traits.depth?.label,
              friend.traits.saturation?.label,
            ].filter(Boolean).map((t, i) => (
              <View key={i} style={styles.traitChip}>
                <Text style={styles.traitChipText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.shopBtn, { backgroundColor: accentColor }]} onPress={onShop}>
          <Text style={styles.shopBtnText}>◎  Shop for {friend.name.split(' ')[0]}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Add friend modal — pick name + season
// ─────────────────────────────────────────────

function AddFriendModal({ visible, onClose, onSave }) {
  const [name, setName]         = useState('');
  const [family, setFamily]     = useState(null);
  const [subSeason, setSubSeason] = useState(null);

  function handleSave() {
    if (!name.trim()) { Alert.alert('Add a name first.'); return; }
    if (!subSeason)   { Alert.alert('Pick their colour season.'); return; }

    const seasonData = SEASON_PROFILES[subSeason];
    const friend = {
      id:            `${Date.now()}`,
      name:          name.trim(),
      subSeason,
      primarySeason: seasonData.family,
      secondaryBorrowing: seasonData.secondaryBorrowing,
      borrowingNote:      seasonData.borrowingNote,
      traits: {
        temperature: { value: seasonData.dominantTraits.temperature, label: traitLabel('temperature', seasonData.dominantTraits.temperature) },
        depth:       { value: seasonData.dominantTraits.depth,       label: traitLabel('depth', seasonData.dominantTraits.depth) },
        saturation:  { value: seasonData.dominantTraits.saturation,  label: traitLabel('saturation', seasonData.dominantTraits.saturation) },
        contrast:    { value: seasonData.dominantTraits.contrast ?? 5, label: 'Medium' },
      },
      addedAt: new Date().toISOString(),
    };
    onSave(friend);
    setName(''); setFamily(null); setSubSeason(null);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => { onClose(); setName(''); setFamily(null); setSubSeason(null); }}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add a friend</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.modalSave, subSeason && name.trim() && styles.modalSaveActive]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
          {/* Name */}
          <Text style={styles.fieldLabel}>Their name</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Maya"
            placeholderTextColor={COLORS.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          {/* Family picker */}
          <Text style={styles.fieldLabel}>Season family</Text>
          <View style={styles.familyRow}>
            {FAMILIES.map(fam => (
              <TouchableOpacity
                key={fam}
                style={[styles.familyBtn, family === fam && styles.familyBtnActive]}
                onPress={() => { setFamily(fam); setSubSeason(null); }}
              >
                <Text style={[styles.familyBtnText, family === fam && styles.familyBtnTextActive]}>
                  {fam}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sub-season picker */}
          {family && (
            <>
              <Text style={styles.fieldLabel}>Specific season</Text>
              <View style={styles.subSeasonList}>
                {SEASONS_BY_FAMILY[family].map(s => {
                  const accent = SEASON_ACCENT_COLORS[s] ?? COLORS.accent;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.subSeasonBtn,
                        subSeason === s && { borderColor: accent, backgroundColor: accent + '15' },
                      ]}
                      onPress={() => setSubSeason(s)}
                    >
                      <View style={[styles.subSeasonDot, { backgroundColor: accent }]} />
                      <Text style={[styles.subSeasonText, subSeason === s && { color: accent, fontWeight: TYPOGRAPHY.weights.semibold }]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Not sure callout */}
          <View style={styles.notSureCard}>
            <Text style={styles.notSureTitle}>Not sure of their season?</Text>
            <Text style={styles.notSureText}>
              Ask them to download Hue Garden and take the quiz — their result will show their exact season and you can add it here.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────

function EmptyState({ onAdd }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>🌿</Text>
      <Text style={styles.emptyTitle}>No friends added yet</Text>
      <Text style={styles.emptySub}>
        Add a friend's colour season to shop for them using the camera matcher — no guessing required.
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
        <Text style={styles.emptyBtnText}>Add your first friend</Text>
      </TouchableOpacity>
    </View>
  );
}

// Simple label helpers for derived traits
function traitLabel(trait, value) {
  if (trait === 'temperature') {
    if (value <= 2.5) return 'Very Warm';
    if (value <= 4.5) return 'Warm';
    if (value <= 5.5) return 'Neutral';
    if (value <= 7.5) return 'Cool';
    return 'Very Cool';
  }
  if (trait === 'depth') {
    if (value <= 2) return 'Fair';
    if (value <= 4) return 'Light';
    if (value <= 6) return 'Medium';
    if (value <= 8) return 'Deep';
    return 'Very Deep';
  }
  if (trait === 'saturation') {
    if (value <= 2) return 'Very Muted';
    if (value <= 4) return 'Muted';
    if (value <= 6) return 'Medium';
    if (value <= 8) return 'Bright';
    return 'Very Bright';
  }
  return '';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.light,
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  addBtnText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },

  list: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },

  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  cardGradient: { padding: SPACING.md },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  cardInfo: { flex: 1 },
  friendName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  friendSeason: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 1,
  },

  paletteRow: {
    flexDirection: 'row',
    height: 28,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  paletteSwatch: { flex: 1 },

  traitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  traitChip: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  traitChipText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },

  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  shopBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  shopBtnText: {
    color: '#FAF8F5',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  removeBtn: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },

  // Modal
  modalSafe: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalCancel: { fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textTertiary },
  modalTitle:  { fontSize: TYPOGRAPHY.sizes.base, fontWeight: TYPOGRAPHY.weights.semibold, color: COLORS.textPrimary },
  modalSave:   { fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textTertiary },
  modalSaveActive: { color: COLORS.accent, fontWeight: TYPOGRAPHY.weights.semibold },

  modalBody: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },

  familyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  familyBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  familyBtnActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  familyBtnText: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  familyBtnTextActive: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.weights.medium },

  subSeasonList: { gap: SPACING.sm, marginBottom: SPACING.lg },
  subSeasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  subSeasonDot: { width: 12, height: 12, borderRadius: 6 },
  subSeasonText: { fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary },

  notSureCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  notSureTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  notSureText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.light,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  emptyBtnText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
