module.exports = function (api) {
  api.cache(true);

  const config = {
    comments: false,
    presets: [
      '@babel/preset-typescript',
      [
        '@babel/preset-env',
        {
          targets: {
            node: true,
          },
        },
      ],
    ],
    retainLines: process.env.NODE_ENV !== 'production',
    sourceMaps: true,
  };

  return config;
};
