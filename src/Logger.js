const chalk = require('chalk');

const Logger = {
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
}

const levels = {
  0: {
    title: 'Print',
    func: console.log,
    color: chalk.bgGreen
  },
  [Logger.ERROR]: {
    title: 'Error',
    func: console.error,
    color: chalk.bgRed
  },
  [Logger.WARN]: {
    title: 'Warn.',
    func: console.warn,
    color: chalk.bgYellow
  },
  [Logger.INFO]: {
    title: 'Info.',
    func: console.info,
    color: chalk.bgBlue
  },
  [Logger.DEBUG]: {
    title: 'Debug',
    func: console.debug,
    color: chalk.bgMagenta
  }
}

const verbosity = {
  common: Logger.WARN
};

function print(obj, level, args) {
  const name = (obj || {}).name;
  if (level <= (verbosity[name] || verbosity.common)) {
    levels[level].func.apply(
      null,
      [
        levels[level].color(`[${levels[level].title}]`),
        chalk.gray(`${name || ''}`.padEnd(16, ' '))
      ].concat(Array.from(args))
    );
  }
}

module.exports = Object.assign(Logger, {
  setLevel(name, level) {
    if (typeof(level) === 'undefined') {
      level = name;
      name = 'common';
    }
    verbosity[name] = level;
  },

  debug(obj, ...args) {
    print(obj, Logger.DEBUG, args);
  },

  info(obj, ...args) {
    print(obj, Logger.INFO, args);
  },

  warn(obj, ...args) {
    print(obj, Logger.WARN, args);
  },

  error(obj, ...args) {
    print(obj, Logger.ERROR, args);
  },

  print(obj, ...args) {
    print(obj, 0, args);
  }
});
