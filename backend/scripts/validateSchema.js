'use strict';

const fs = require('fs');
const path = require('path');
const { mergeTypeDefs } = require('@graphql-tools/merge');
const { loadFilesSync } = require('@graphql-tools/load-files');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const SCHEMA_DIR = path.join(__dirname, '..', 'graphql', 'schema');

async function main() {
  console.log('SmartBankAI — GraphQL Schema Validation\n');

  if (!fs.existsSync(SCHEMA_DIR)) {
    console.error(`Schema directory not found: ${SCHEMA_DIR}`);
    process.exit(1);
  }

  try {
    const files = loadFilesSync(path.join(SCHEMA_DIR, '**/*.graphql'));
    console.log(`Loaded ${files.length} schema file(s) from ${SCHEMA_DIR}`);

    console.log('Merging type definitions...');
    const typeDefs = mergeTypeDefs(files);
    
    console.log('Building executable schema...');
    makeExecutableSchema({ 
      typeDefs,
      resolverValidationOptions: {
        requireResolversForResolveType: 'ignore'
      }
    });

    console.log('\n✅ SUCCESS: Schema is valid.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR: Schema validation failed');
    console.error('==================================================');
    console.error(err.message);
    if (err.locations) {
      console.error('Locations:', JSON.stringify(err.locations));
    }
    console.error('==================================================');
    process.exit(1);
  }
}

main();
