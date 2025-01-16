module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      "@babel/plugin-transform-nullish-coalescing-operator",
      "@babel/plugin-transform-class-properties",
      "@babel/plugin-transform-optional-chaining"
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
        verbose: false,
      }],
    ],
  };
};