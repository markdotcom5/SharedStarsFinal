const globals = require("globals");
const pluginJs = require("@eslint/js");
const pluginReact = require("eslint-plugin-react");

module.exports = {
  plugins: [pluginJs, pluginReact],
  globals,
};
