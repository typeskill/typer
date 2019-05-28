module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ["transform-es2015-modules-commonjs"]
  };
};
