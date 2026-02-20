export default [
  {
    files: ["content.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        document: "readonly",
        window: "readonly",
        MutationObserver: "readonly",
        Node: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        getComputedStyle: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "error",
      "no-undef": "error",
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  {
    ignores: ["node_modules/", "tests/", "eslint.config.js"],
  },
];
