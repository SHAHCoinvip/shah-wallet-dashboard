#!/usr/bin/env tsx

/**
 * Standalone Environment Validation Script
 * Run with: npx tsx scripts/validate-env.ts
 */

// Ensure environment variables from .env.local (and optionally .env.production) are loaded
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

const localEnvPath = path.join(process.cwd(), '.env.local')
const prodEnvPath = path.join(process.cwd(), '.env.production')

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath })
} else if (fs.existsSync(prodEnvPath)) {
  dotenv.config({ path: prodEnvPath })
}

import { validateEnv } from '../src/lib/env-validator';

console.log('🔍 SHAH Web3 Wallet - Environment Validation');
console.log('=============================================\n');

try {
  await validateEnv();
  console.log('\n🎉 All environment variables are properly configured!');
  process.exit(0);
} catch (error) {
  console.error('\n💥 Environment validation failed:', error);
  process.exit(1);
} 