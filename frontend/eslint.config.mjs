import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  {
    files: [
      "src/features/chat/components/**/*.{ts,tsx}",
      "src/features/chat/hooks/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/supabase/*"],
              message:
                "Chat UI and hooks must use lifecycle/service boundaries, not Supabase directly.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/chat/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/supabase/*", "@/features/chat/services/*"],
              message: "Chat components may consume hooks and view models only.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js",
    "public/workbox-*.js",
  ]),
]);

export default eslintConfig;
