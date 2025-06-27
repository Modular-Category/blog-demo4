
module.exports = function (context, options) {
  return {
    name: 'docusaurus-qworld-plugin',
    configureRemarkPlugins() {
      return [
        require('./remark-qworld-diagram'),
      ];
    },
  };
};
