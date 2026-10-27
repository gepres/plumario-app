import { useState, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categoryOf, figureOf, formatAlbumNumber } from '@plumario/core';
import { spacing } from '@plumario/tokens';
import { BirdSticker, Button, Card, TextField, ThemedText, ToggleGroup, type BirdArt } from '@plumario/ui';

import { stickerTint } from '@/constants/habitats';

import { FORM_NAME, ILLUSTRATION_MODELS, PILOT_SPECIES } from './pilot-data';

const CATEGORY_LABELS = { holographic: 'holográfico', silver: 'plata', gold: 'oro', ruby: 'rubí', diamond: 'diamante' } as const;

type Vote = '' | 'A' | 'B' | 'C';
const VOTE_OPTIONS: readonly { key: Vote; label: string }[] = [
  { key: 'A', label: 'A · Claude' },
  ...ILLUSTRATION_MODELS.map(({ letter, label }) => ({ key: letter as Vote, label: `${letter} · ${label}` })),
];
type SendState = 'idle' | 'sending' | 'sent' | 'error';

// La opinión se guarda en Netlify Forms; solo existe en la web publicada.
const CAN_SEND = Platform.OS === 'web';

async function sendOpinion(fields: Record<string, string>) {
  const response = await fetch('/__forms.html', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ 'form-name': FORM_NAME, ...fields }).toString(),
  });
  if (!response.ok) throw new Error(`Netlify respondió ${response.status}`);
}

/** Piloto (PA-30): el sticker de cada especie con la figura de hoy y un dibujo propio hecho con Claude (A), Gemini (B) y ChatGPT (C). */
export function StickerPilot() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const size = width < 600 ? 100 : 116;
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [sendState, setSendState] = useState<SendState>('idle');

  const submit = async () => {
    setSendState('sending');
    try {
      await sendOpinion({ nombre: name, comentario: comment, ...Object.fromEntries(PILOT_SPECIES.map(({ id }) => [id, votes[id] ?? ''])) });
      setSendState('sent');
    } catch {
      setSendState('error');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
      <ThemedText variant="title">¿Qué dibujo le queda mejor a cada ave?</ThemedText>
      <ThemedText variant="body" color="textSecondary">
        Plumario es un álbum de aves de Ica: cada especie tiene un sticker que se completa al fotografiarla. Hoy el sticker usa la figura de su grupo, y muchas son siluetas negras. Probamos tres formas de darle a cada especie su propio dibujo:
      </ThemedText>
      <View style={styles.legend}>
        <ThemedText variant="bodyStrong">A · Claude <ThemedText variant="body" color="textSecondary">— ilustración generada con IA, en dibujo vectorial con el estilo del diseño</ThemedText></ThemedText>
        <ThemedText variant="bodyStrong">B · Gemini <ThemedText variant="body" color="textSecondary">— ilustración generada con IA</ThemedText></ThemedText>
        <ThemedText variant="bodyStrong">C · ChatGPT <ThemedText variant="body" color="textSecondary">— ilustración generada con IA</ThemedText></ThemedText>
      </View>
      <ThemedText variant="caption" color="textSecondary">
        Desliza cada fila para ver también la versión cromada (la que sale al azar o por intercambio) y la sombra (la especie que aún no registras).
        {CAN_SEND ? ' Elige tu favorita en cada ave y, al final, déjanos un comentario.' : ''}
      </ThemedText>

      {PILOT_SPECIES.map((species) => {
        const figure = figureOf(species);
        const category = categoryOf(species);
        const common = { figure, name: species.commonName, number: formatAlbumNumber(species.albumNumber), tint: stickerTint(species.habitat), size };
        const options: { letter: string; label: string; art: BirdArt | null }[] = [
          { letter: 'A', label: 'Claude', art: { xml: species.vector } },
          ...ILLUSTRATION_MODELS.map(({ letter, label }, i) => {
            const image = species.illustrations[i];
            return { letter, label, art: image ? { image } : null };
          }),
        ];
        const missing = (
          <View style={[styles.missing, { width: size, height: (size * 205) / 160 }]}>
            <ThemedText variant="caption" color="textSecondary" style={styles.center}>Sin generar</ThemedText>
          </View>
        );
        const columns: { key: string; label: string; node: ReactNode }[] = [
          { key: 'today', label: 'Hoy', node: <BirdSticker {...common} /> },
          ...options.map(({ letter, label, art }) => ({ key: letter, label: `${letter} · ${label}`, node: art ? <BirdSticker {...common} art={art} /> : missing })),
          ...options.map(({ letter, art }) => ({
            key: `${letter}-chrome`,
            label: `${letter} · ${CATEGORY_LABELS[category]}`,
            node: art ? <BirdSticker {...common} art={art} finish={category} /> : missing,
          })),
          { key: 'shadow', label: 'Sombra', node: <BirdSticker {...common} empty /> },
        ];
        return (
          <View key={species.id} style={styles.species}>
            <ThemedText variant="section">{species.commonName}</ThemedText>
            <ThemedText variant="scientific" color="textSecondary">{species.scientificName}</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {columns.map(({ key, label, node }) => (
                <View key={key} style={styles.column}>
                  {node}
                  <ThemedText variant="caption" color="textSecondary">{label}</ThemedText>
                </View>
              ))}
            </ScrollView>
            {CAN_SEND && <ThemedText variant="captionStrong">Tu favorita:</ThemedText>}
            {CAN_SEND && (
              <ToggleGroup
                label={`Tu favorita para ${species.commonName}`}
                options={VOTE_OPTIONS}
                value={votes[species.id] ?? ''}
                onChange={(vote) => setVotes((current) => ({ ...current, [species.id]: vote }))}
              />
            )}
          </View>
        );
      })}

      {CAN_SEND && (
        <Card style={styles.form}>
          <ThemedText variant="section">Tu opinión</ThemedText>
          {sendState === 'sent' ? (
            <ThemedText variant="body">¡Gracias! Tu opinión llegó.</ThemedText>
          ) : (
            <>
              <TextField label="Tu nombre" value={name} onChangeText={setName} autoComplete="name" />
              <TextField label="Comentario (opcional)" value={comment} onChangeText={setComment} multiline />
              {sendState === 'error' && (
                <ThemedText variant="caption" color="error">No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.</ThemedText>
              )}
              <Button label="Enviar mi opinión" onPress={submit} busy={sendState === 'sending'} disabled={Object.keys(votes).length === 0 && comment.trim() === ''} />
            </>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing[4], gap: spacing[3] },
  legend: { gap: spacing[1] },
  species: { gap: spacing[1], marginTop: spacing[4] },
  row: { gap: spacing[3], paddingVertical: spacing[2] },
  column: { alignItems: 'center', gap: spacing[2] },
  missing: { borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#B9B4AA', alignItems: 'center', justifyContent: 'center', padding: spacing[2] },
  center: { textAlign: 'center' },
  form: { gap: spacing[3], marginTop: spacing[5] },
});
