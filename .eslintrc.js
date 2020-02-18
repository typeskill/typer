module.exports = {
  plugins: [
    "react-hooks"
  ],
  extends: [
    "@typeskill/eslint-config", // Uses the recommended rules from typeskill
  ],
  parserOptions: {
    project: './tsconfig.json' // change tsconfig to whichever appropriate config file
  },
}
