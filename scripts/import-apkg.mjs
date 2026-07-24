// One-time ETL: extracts Dutch vocab + media from the three Netjes Nederlands
// Anki decks and writes src/data/words.json, src/data/decks.json, and
// namespaced media into public/media/<deckId>/. Safe to re-run.
import AdmZip from 'adm-zip'
import initSqlJs from 'sql.js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const DECKS = [
  { file: '/Users/jessicaferine/Downloads/netjes_1.apkg', id: 'deck1', label: 'Level 1: Basics', order: 1 },
  { file: '/Users/jessicaferine/Downloads/netjes_2.apkg', id: 'deck2', label: 'Level 2: Everyday Dutch', order: 2 },
  { file: '/Users/jessicaferine/Downloads/netjes_3.apkg', id: 'deck3', label: 'Level 3: Advanced', order: 3 },
]

const FIELD_ORDER = [
  'english',
  'dutch',
  'notesEn',
  'notesNl',
  'audioRaw',
  'imageRaw',
  'cardClass',
  'cardClassFront',
  'chapterBtn',
  'findBtn',
]

function splitAlternates(value) {
  return value
    .split(' / ')
    .map((s) => s.trim())
    .filter(Boolean)
}

function cleanNotes(html) {
  if (!html) return null
  const cleaned = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
  return cleaned.length > 0 ? cleaned : null
}

function parseAudioFile(raw) {
  const match = raw.match(/\[sound:([^\]]+)\]/)
  return match ? match[1] : null
}

function parseImageFile(raw) {
  const match = raw.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : null
}

function parseChapter(chapterBtnHtml) {
  const match = chapterBtnHtml.match(/resources\/(\d+-\d+)/)
  return match ? match[1] : null
}

async function importDeck(SQL, deck) {
  const zip = new AdmZip(deck.file)
  const entries = zip.getEntries()
  const entryByName = new Map(entries.map((e) => [e.entryName, e]))

  const collectionEntry = entryByName.get('collection.anki21') ?? entryByName.get('collection.anki2')
  if (!collectionEntry) throw new Error(`No collection db found in ${deck.file}`)

  const db = new SQL.Database(collectionEntry.getData())
  const result = db.exec('SELECT id, flds FROM notes')
  const rows = result[0]?.values ?? []

  const mediaEntry = entryByName.get('media')
  const mediaManifest = mediaEntry ? JSON.parse(mediaEntry.getData().toString('utf8')) : {}
  const filenameToBlob = new Map(Object.entries(mediaManifest).map(([blob, filename]) => [filename, blob]))

  const mediaOutDir = path.join(ROOT, 'public', 'media', deck.id)
  mkdirSync(mediaOutDir, { recursive: true })

  const words = []
  let missingAudio = 0
  let missingImage = 0
  const chaptersSeen = new Set()
  const copiedBlobs = new Set()

  for (const [noteId, flds] of rows) {
    const parts = flds.split('\x1f')
    const raw = Object.fromEntries(FIELD_ORDER.map((key, i) => [key, parts[i] ?? '']))

    const audioFile = raw.audioRaw ? parseAudioFile(raw.audioRaw) : null
    const imageFile = raw.imageRaw ? parseImageFile(raw.imageRaw) : null
    const chapter = raw.chapterBtn ? parseChapter(raw.chapterBtn) : null
    if (chapter) chaptersSeen.add(chapter)

    if (audioFile) {
      const blob = filenameToBlob.get(audioFile)
      const entry = blob !== undefined ? entryByName.get(blob) : undefined
      if (entry) {
        if (!copiedBlobs.has(audioFile)) {
          writeFileSync(path.join(mediaOutDir, audioFile), entry.getData())
          copiedBlobs.add(audioFile)
        }
      } else {
        missingAudio += 1
      }
    } else {
      missingAudio += 1
    }

    if (imageFile) {
      const blob = filenameToBlob.get(imageFile)
      const entry = blob !== undefined ? entryByName.get(blob) : undefined
      if (entry) {
        if (!copiedBlobs.has(imageFile)) {
          writeFileSync(path.join(mediaOutDir, imageFile), entry.getData())
          copiedBlobs.add(imageFile)
        }
      } else {
        missingImage += 1
      }
    } else {
      missingImage += 1
    }

    words.push({
      id: `${deck.id}-${noteId}`,
      deckId: deck.id,
      english: raw.english,
      englishAlternates: splitAlternates(raw.english),
      dutch: raw.dutch,
      dutchAlternates: splitAlternates(raw.dutch),
      notesEn: cleanNotes(raw.notesEn),
      notesNl: cleanNotes(raw.notesNl),
      audioFile,
      imageFile,
      chapter,
    })
  }

  db.close()

  console.log(
    `[${deck.id}] ${words.length} notes | missing audio: ${missingAudio} | missing image: ${missingImage} | chapters: ${chaptersSeen.size} (${[...chaptersSeen].sort().join(', ') || 'none'})`,
  )

  return { words, noteCount: words.length }
}

async function main() {
  const SQL = await initSqlJs({
    locateFile: (f) => path.join(ROOT, 'node_modules', 'sql.js', 'dist', f),
  })

  const allWords = []
  const decksMeta = []

  for (const deck of DECKS) {
    const { words, noteCount } = await importDeck(SQL, deck)
    allWords.push(...words)
    decksMeta.push({ id: deck.id, label: deck.label, order: deck.order, noteCount })
  }

  const dataDir = path.join(ROOT, 'src', 'data')
  mkdirSync(dataDir, { recursive: true })
  writeFileSync(path.join(dataDir, 'words.json'), JSON.stringify(allWords, null, 2))
  writeFileSync(path.join(dataDir, 'decks.json'), JSON.stringify(decksMeta, null, 2))

  console.log(`\nTotal words: ${allWords.length}`)
  console.log('Wrote src/data/words.json, src/data/decks.json, public/media/deck{1,2,3}/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
