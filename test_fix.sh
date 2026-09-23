#!/bin/bash
set -euo pipefail

# Find all test files
find src -name "*.test.ts" -o -name "*.test.tsx" > test_files.txt
find lib -name "*.test.ts" -o -name "*.test.tsx" >> test_files.txt

# Run vitest
npx vitest run || echo "Tests failed"
