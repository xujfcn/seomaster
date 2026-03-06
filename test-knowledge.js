// Test knowledge base loading
const { loadKnowledge } = require('./scripts/lib/knowledge');

console.log('Testing knowledge base loading...\n');

// Test 1: Load with pricing keyword
console.log('=== Test 1: Keyword "pricing" ===');
const pricingKnowledge = loadKnowledge('pricing', 5000);
console.log(`Length: ${pricingKnowledge.length} chars\n`);

// Test 2: Load with api keyword
console.log('=== Test 2: Keyword "api" ===');
const apiKnowledge = loadKnowledge('api', 5000);
console.log(`Length: ${apiKnowledge.length} chars\n`);

// Test 3: Load with unrelated keyword
console.log('=== Test 3: Keyword "unrelated" ===');
const unrelatedKnowledge = loadKnowledge('unrelated', 5000);
console.log(`Length: ${unrelatedKnowledge.length} chars\n`);
