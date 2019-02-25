'use strict';

const si = require('systeminformation');

module.exports.main = () => {
  return si.getAllData()
    .then(data => {
      data.lambdaPrice = process.env.price;
      data.lambdaMemory = process.env.memory;
      return data
    });
};