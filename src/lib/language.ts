import type { PitchChannel, PitchLanguage } from "@/lib/types";

/**
 * How each language should actually sound.
 *
 * The first version of this file was one line per language ("write natural
 * conversational Malayalam") and the output read like Google Translate: textbook
 * word order, every English word transliterated into Malayalam script, and the
 * same written-only verb endings a government notice uses. Nobody types like
 * that on WhatsApp. The rules below are long on purpose - they describe the
 * register, not the language.
 */
export const LANGUAGE_RULE: Record<PitchLanguage, string[]> = {
  english: [
    "Write in simple Indian English, the way one business owner messages another.",
    "- Short sentences. No corporate words: leverage, utilise, reach out, touch base, synergy, kindly do the needful.",
    "- Contractions are fine (I'm, you're, don't).",
  ],

  malayalam: [
    "Write in Malayalam script, in SPOKEN Kerala Malayalam - the way a Malayali types on WhatsApp, not the way Malayalam is written in a newspaper, a textbook or a government letter.",
    "- Keep ordinary English business and tech words in ENGLISH LETTERS inside the Malayalam sentence, exactly as people type them: website, Google, rating, review, customer, booking, online, mobile, page, design, free, report, WhatsApp, number, order, enquiry, search, shop.",
    "- Never transliterate those words into Malayalam script. Writing വെബ്സൈറ്റ്, റേറ്റിംഗ്, റിവ്യൂസ്, ബിസിനസ്, ഓൺലൈൻ, കസ്റ്റമർ is the single clearest sign of machine translation. Use website, rating, review, business, online, customer instead.",
    "- Short sentences, 6 to 12 words. One idea each. Break anything longer in two.",
    "- Use spoken endings: ഉണ്ട്, ഇല്ല, ഉണ്ടോ, ആണോ, അല്ലേ, വേണ്ടേ, ചെയ്യാം, നോക്കാം, അയക്കാം, പറ്റും, വേണോ, ഒന്ന്.",
    "- Never use written-only forms: താങ്കൾ, താങ്കളുടെ, സാധിക്കുന്നതാണ്, ചെയ്യുന്നതായിരിക്കും, ആയിരിക്കും, എന്നതാണ്, ഉപയോഗപ്രദമാകുമോ, ശ്രദ്ധയിൽപ്പെട്ടിരിക്കുന്നു, അറിയിക്കുന്നു.",
    "- Drop the pronoun wherever Malayalam allows it. Starting sentence after sentence with നിങ്ങൾ or നിങ്ങളുടെ is how translated text reads; real messages use the business name once and then leave it out.",
    "- Never translate an English phrase word by word. There is no Malayalam for 'I came across your business' or 'I noticed that' - just say the thing: Google Maps-ൽ കണ്ടു, or state the fact on its own.",
    "- Numbers in digits (4.8, 5890), not spelled out.",
    "- Before finishing, read it back as speech. If a line sounds like something read out on the news, rewrite it the way you would say it to a shop owner standing in front of you.",
    "",
    "Style reference - copy the RHYTHM and word choice only, never these sentences, facts or jokes:",
    "Hi, Kell Salon അല്ലേ? Google-ൽ 4.8 rating, 5890 review — കൊള്ളാം. പക്ഷേ website ഒന്നും കണ്ടില്ല. Search ചെയ്ത് വരുന്നവർക്ക് booking എടുക്കാൻ ഒരു വഴി വേണ്ടേ? ഒരു sample page ഉണ്ടാക്കി അയക്കട്ടെ? Free ആണ്, നിർബന്ധം ഒന്നുമില്ല.",
  ],

  manglish: [
    "Write in Manglish: spoken Malayalam typed in English letters, the way Kerala chats on WhatsApp.",
    "- Everyday English words stay as normal English words (website, rating, review, booking, customer, free, design, report). Only the Malayalam gets transliterated.",
    "- Use the spellings people actually type: und, undo, illa, alle, aanu, aano, venda, veno, cheyyam, nokkam, ayakkatte, pattumo, onnu, pakshe, ippo, ithu, njan, ningalude.",
    "- Short sentences, 6 to 12 words. No capital letters mid-sentence except for English words and names.",
    "- Never write stiff transliterated book Malayalam (saadhikkunnathaanu, thaangalude). If you would not type it to a friend, do not write it.",
    "- Never translate an English phrase word by word.",
    "",
    "Style reference - copy the RHYTHM and word choice only, never these sentences, facts or jokes:",
    "Hi, Kell Salon alle? Google-il 4.8 rating und, 5890 review — kidu. Pakshe website onnum kandilla. Search cheythu varunnavarkku booking edukkan oru vazhi venda? Oru sample page undaakki ayakkatte? Free aanu, nirbandham onnumilla.",
  ],
};

/** WhatsApp and email are not the same medium, and a pitch that ignores that gets deleted. */
export const CHANNEL_RULE: Record<PitchChannel, string[]> = {
  whatsapp: [
    "Medium: WhatsApp. It is read on a phone, in a list of messages from family and customers.",
    "- No subject line, no 'Dear', no formal letter opening or closing.",
    "- Line breaks are free; a wall of text is not.",
  ],
  email: [
    "Medium: email, to a business inbox that gets plenty of cold mail.",
    "- Output the subject line first, on its own line, in exactly this form: SUBJECT: <the subject>",
    "- Then one blank line, then the email body. Nothing else, before or after.",
    "- The subject is under 50 characters, specific to this business, and says something real. No 'Re:', no 'Quick question', no ALL CAPS, no emoji, no clickbait.",
    "- Body: 90 to 140 words, in 2 or 3 short paragraphs separated by a blank line. Greet them by business name on the first line.",
    "- Plain text only: no markdown, no bullet characters, no headings, no links other than ones given in the data.",
    "- Close on its own lines: the sender's name, then the brand, then the phone number if there is one.",
    "- It still has to sound like a person wrote it to one business. No 'I hope this email finds you well', no 'I am reaching out', no paragraph about who the sender is.",
  ],
};

/** Splits an email draft into its subject and body. Falls back to the whole text as the body. */
export function splitEmail(text: string): { subject: string; message: string } {
  const m = text.match(/^\s*subject\s*:\s*(.+?)\s*\n([\s\S]*)$/i);
  if (!m) return { subject: "", message: text.trim() };
  return { subject: m[1].trim(), message: m[2].trim() };
}
