// @ts-check
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [tseslint.configs.base, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "tsp",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "tsp",
          style: "kebab-case",
        },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: ["classProperty", "parameterProperty"],
          modifiers: ["private"],
          format: null,
          leadingUnderscore: "require",
        },
      ],
      "@angular-eslint/no-empty-lifecycle-method": "off",
      "@angular-eslint/no-output-native": "off",
      "@angular-eslint/prefer-standalone": "off",
      "@angular-eslint/prefer-inject": "off",
      "@angular-eslint/prefer-on-push-component-change-detection": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  }
);
