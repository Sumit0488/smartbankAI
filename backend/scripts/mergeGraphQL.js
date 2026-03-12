/**
 * backend/scripts/mergeGraphQL.js
 * Merges all .graphql files from app-modules into a single schema.graphql file.
 * Run: npm run merge-graphql
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const modulesDir = path.join(__dirname, '..', 'src', 'app-modules');
const outputFile = path.join(__dirname, '..', 'src', 'schema.graphql');

const files = glob.sync(`${modulesDir}/**/*.graphql`);

if (files.length === 0) {
  console.warn('⚠️  No .graphql files found in app-modules/');
  process.exit(0);
}

const merged = files.map(f => {
  const content = fs.readFileSync(f, 'utf8');
  const moduleName = path.basename(path.dirname(f));
  return `# ── ${moduleName} ──\n${content}`;
}).join('\n\n');

fs.writeFileSync(outputFile, merged, 'utf8');
console.log(`✅  Merged ${files.length} GraphQL file(s) → src/schema.graphql`);
files.forEach(f => console.log(`   • ${path.relative(modulesDir, f)}`));
