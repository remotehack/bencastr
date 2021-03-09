// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: { url: "/" },
    src: { url: "/_dist" },
  },
  plugins: [
    "@snowpack/plugin-typescript",
    "@snowpack/plugin-react-refresh",
    "@snowpack/plugin-webpack",
  ],
  packageOptions: {
    source: "remote",
    types: true,
  },
  devOptions: {},
  buildOptions: {
    baseUrl: "./",
  },
};
