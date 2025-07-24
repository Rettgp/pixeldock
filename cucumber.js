module.exports = {
  default: [
    '--require-module ts-node/register',
    '--require ./features/steps/**/*.ts',
  ].join(' '),
};