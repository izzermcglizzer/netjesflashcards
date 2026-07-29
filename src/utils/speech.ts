/** Speaks a Dutch sentence aloud via the browser's built-in speech synthesis — used for
 * curated example sentences, which don't have pre-recorded audio like single words do. */
export function speakDutch(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'nl-NL'
  window.speechSynthesis.speak(utterance)
}
