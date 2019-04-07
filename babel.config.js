'use strict';

module.exports = function(api) {
  api.cache(true);

  return {
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
    sourceMaps: true,
  };
};
