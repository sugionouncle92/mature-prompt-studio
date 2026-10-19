import assert from 'node:assert';
import { STORY_CATEGORIES } from '../src/data/storyStyles.ts';
import { PHOTOGRAPHIC_STYLES } from '../src/data/photographicStyles.ts';
import { GeminiService } from '../src/services/geminiService.ts';
import { translations } from '../src/i18n/translations.ts';

console.log('--- STARTING VERIFICATION TEST SUITE ---');

// 1. Verify Story Categories (12 categories A-L, 10 items each)
console.log('Test 1: Verify Story Style catalog...');
assert.strictEqual(STORY_CATEGORIES.length, 12, 'Must have exactly 12 Story Style categories (A to L)');
for (const cat of STORY_CATEGORIES) {
  assert.strictEqual(cat.items.length, 10, `Category ${cat.name} must have exactly 10 sub-styles`);
}
console.log('✓ Story Style catalog has 12 categories and 120 total styles.');

// 2. Verify Photographic Styles (including dedicated Ultra Realistic)
console.log('Test 2: Verify Photographic Styles...');
const ultraStyle = PHOTOGRAPHIC_STYLES.find(s => s.name === 'Ultra Realistic');
assert.ok(ultraStyle, 'Ultra Realistic must exist as a dedicated option');
assert.strictEqual(ultraStyle.isMandatoryUltra, true, 'Ultra Realistic must have isMandatoryUltra set');
console.log('✓ Dedicated Ultra Realistic photographic style verified.');

// 3. Verify GeminiService singleton
console.log('Test 3: Verify GeminiService singleton...');
const service1 = GeminiService.getInstance();
const service2 = GeminiService.getInstance();
assert.strictEqual(service1, service2, 'GeminiService must be a singleton');
console.log('✓ GeminiService singleton verified.');

// 4. Verify System Instruction Generation with Ultra Realistic
console.log('Test 4: Verify System Instruction with Ultra Realistic...');
const mockInputUltra = {
  samplePrompt: 'Wanita dewasa berusia 30 tahun duduk di dekat jendela ruang tamu yang nyaman.', // Indonesian input
  keywords: 'pencahayaan sinematik, pose anggun', // Indonesian input
  storyStyle: {
    primary: 'Sensual & Alluring',
    supporting: ['Romantic Tension', 'Slow-Burn Romance'],
    custom: '',
  },
  photographicStyle: {
    selected: ['Ultra Realistic', 'Cinematic Photography'],
    custom: '',
  },
  characterLocks: {
    facelock: true,
    bodyshape: true,
    outfitlock: true,
    poselock: false,
    agepreserve: true,
    expressionlock: false,
    hairlock: true,
  },
  variationCount: 3,
};

// Access private/internal builders via prototype/cast
const systemInstruction = service1['buildSystemInstruction'](mockInputUltra);
assert.ok(systemInstruction.includes('ULTRA REALISTIC RENDERING MANDATE'), 'Must contain Ultra Realistic mandate');
assert.ok(systemInstruction.includes('skin microtexture with visible pores'), 'Must detail skin pores and microtexture');
assert.ok(systemInstruction.includes('/facelock 100%'), 'Must contain active /facelock 100%');
assert.ok(systemInstruction.includes('/bodyshape lock'), 'Must contain active /bodyshape lock');
assert.ok(systemInstruction.includes('/outfitlock'), 'Must contain active /outfitlock');
assert.ok(systemInstruction.includes('/agepreserve'), 'Must contain active /agepreserve (25+)');
assert.ok(systemInstruction.includes('/hairlock'), 'Must contain active /hairlock');
assert.ok(!systemInstruction.includes('/poselock: Strictly retain'), 'Disabled poselock must not be active');
assert.ok(!systemInstruction.includes('/expressionlock: Strictly preserve'), 'Disabled expressionlock must not be active');
// Strict mandate: The output prompts must ALWAYS be in English regardless of input language
assert.ok(systemInstruction.includes('LANGUAGE: The final prompts must ALWAYS be in natural, descriptive English, regardless of input language.'));
console.log('✓ Ultra Realistic mandate & Character Locks constraints correctly applied.');
console.log('✓ English output language constraint strictly enforced in system instruction.');

// 5. Verify User Prompt Builder (Sample + Keywords combination)
console.log('Test 5: Verify User Prompt Builder...');
const userPrompt = service1['buildUserPrompt'](mockInputUltra);
assert.ok(userPrompt.includes('[PROMPT SAMPLE (Source of Truth for Scene & Identity)]'), 'Must include Sample Prompt');
assert.ok(userPrompt.includes('[KEYWORDS / SCENE IDEA]'), 'Must include Keywords');
assert.ok(userPrompt.includes('Primary Style: "Sensual & Alluring"'), 'Must specify Primary Style');
assert.ok(userPrompt.includes('Supporting Styles: "Romantic Tension", "Slow-Burn Romance"'), 'Must specify Supporting Styles');
assert.ok(userPrompt.includes('/facelock 100%'), 'Must include active lock tag');
assert.ok(userPrompt.includes('Generate exactly 3 standalone, copy-ready English image prompt variation(s)'), 'Must request exact count');
console.log('✓ Combined prompt input logic correctly formatted.');

// 6. Verify Output Parser (Strips labels, markdown, and ensures prompt text only)
console.log('Test 6: Verify Response Parsing and Label Stripping...');
const rawMockResponse = JSON.stringify({
  prompts: [
    'Variation 1: An ultra realistic photographic portrait of a 30-year-old woman by a sunlit mahogany window frame, detailed skin pores, natural wisps of dark brown hair, silk blouse folds, soft golden hour lighting.',
    'Prompt 2: An authentic 35mm film still of a 30-year-old woman looking gently towards the veranda, subtle skin texture and eyelashes in sharp focus, amber rim light, shallow depth of field.'
  ]
});

const parsed = service1['parseResponse'](rawMockResponse, 2);
assert.strictEqual(parsed.length, 2, 'Must parse exactly 2 prompts');
assert.ok(!parsed[0].startsWith('Variation 1:'), 'Must strip "Variation 1:" prefix');
assert.ok(!parsed[1].startsWith('Prompt 2:'), 'Must strip "Prompt 2:" prefix');
console.log('✓ Parser successfully strips labels and produces pure prompt text.');

// 7. Verify Validation on Empty Connection Test
console.log('Test 7: Verify Connection Test Validation on Empty Key...');
service1.testConnection('', 'gemini-2.5-flash').then((res) => {
  assert.strictEqual(res.valid, false);
  assert.ok(res.message.includes('API Key cannot be empty'));
  console.log('✓ Empty API Key caught.');

  // Test Empty Model ID
  return service1.testConnection('test-key', '');
}).then((res) => {
  assert.strictEqual(res.valid, false);
  assert.ok(res.message.includes('Model ID cannot be empty'));
  console.log('✓ Empty Model ID caught.');

  // 8. Verify i18n Translations Parity
  console.log('Test 8: Verify i18n Dictionary Parity between "id" and "en"...');
  const idKeys = Object.keys(translations.id);
  const enKeys = Object.keys(translations.en);
  assert.strictEqual(idKeys.length, enKeys.length, 'ID and EN translation dictionaries must have identical top-level key count');
  for (const k of idKeys) {
    assert.ok(k in translations.en, `Key "${k}" missing in English dictionary`);
  }
  console.log(`✓ Both "id" and "en" dictionaries contain ${idKeys.length} matching localized entries.`);

  console.log('\n--- ALL TEST SUITE CHECKS PASSED SUCCESSFULLY (8/8) ---');
}).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
