module.exports = {
    presets: [
      "@babel/env",
      "@babel/typescript"
    ],
    plugins: [
      ["module-resolver", {
        "extensions": [".js", ".jsx", ".ts", ".tsx"],
        "root": ["./src"],
        "alias": {
          "@delta": "./delta",
          "@test": "./test",
          "@core": "./core",
          "@model": "./model",
          "@components": "./components"
        }
      }],
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread'
    ],
    "ignore": [
      "**/*.test.ts",
      "**/*.test.tsx"
    ]
}
  