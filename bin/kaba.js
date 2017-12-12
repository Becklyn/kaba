#!/usr/bin/env node

const chalk = require("chalk");


console.log(``);
console.log(`${chalk.black(chalk.bgYellow("  ~~~~~~~~~  "))}`);
console.log(`${chalk.black(chalk.bgYellow("   🍫️ kaba   "))}`);
console.log(`${chalk.black(chalk.bgYellow("  ~~~~~~~~~  "))}`);
console.log(``);

console.log('Running webpack ...');
console.log();

return require('webpack/bin/webpack');
