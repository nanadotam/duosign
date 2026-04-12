import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

import type { Config } from "jest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../..");
const frontendRequire = createRequire(path.join(repoRoot, "frontend/package.json"));
const tsJestTransform = frontendRequire.resolve("ts-jest");
const jsdomEnvironment = frontendRequire.resolve("jest-environment-jsdom");

const config: Config = {
  rootDir: repoRoot,
  testEnvironment: jsdomEnvironment,
  testMatch: ["<rootDir>/tests/frontend/**/*.test.ts", "<rootDir>/tests/frontend/**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/tests/frontend/jest.setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      tsJestTransform,
      {
        diagnostics: false,
        isolatedModules: true,
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          allowJs: true,
          module: "commonjs",
          target: "es2019",
          moduleResolution: "node",
          baseUrl: path.join(repoRoot, "frontend"),
          types: ["jest", "@testing-library/jest-dom", "node"],
          paths: {
            "@/*": ["src/*"],
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/frontend/src/$1",
    "^react$": "<rootDir>/frontend/node_modules/react",
    "^react-dom$": "<rootDir>/frontend/node_modules/react-dom",
    "^react-dom/client$": "<rootDir>/frontend/node_modules/react-dom/client",
    "^react/jsx-runtime$": "<rootDir>/frontend/node_modules/react/jsx-runtime",
    "^@testing-library/react$": "<rootDir>/frontend/node_modules/@testing-library/react",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleDirectories: ["<rootDir>/frontend/node_modules", "node_modules"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

export default config;
