module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: [
    "docs/**",
    "contracts/**/*.md",
    "contracts/**/*.json",
    "tests/fixtures/**",
    "node_modules/**"
  ],
  overrides: [
    {
      files: ["**/*.ts"],
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      rules: {}
    }
  ]
};
