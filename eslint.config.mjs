import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * Minimal lint baseline. `eslint-config-next` (next/core-web-vitals) was evaluated but every
 * published version pulls fast-glob -> micromatch -> braces with an unfixed high-severity
 * advisory, which would break CI's `npm audit --audit-level=high` gate. This config keeps the
 * part of core-web-vitals that catches real bugs (React hooks rules) plus correctness-only
 * TypeScript rules; no stylistic rules and no type-aware (slow) rules.
 */
export default tseslint.config(
  { ignores: [".next/**", "node_modules/**", "ios/**", "coverage/**", "out/**", "next-env.d.ts"] },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [tseslint.configs.recommended],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
);
