#! /usr/bin/env node
import { argv } from 'yargs';
import * as fs from 'graceful-fs';
const validWords = require('../typoconfig.json').validWords;

interface WordDictionary {
    [index: string]: boolean;
}

let dict: WordDictionary = {};



fs.readFile(argv._[0], 'UTF-8', (err, data) => {
  if (err) {
    console.log('Error reading file: ' + err);
    return;
  }
  let lines = data.split('\n');
  let words = [];
  for (let i = 0; i < lines.length; i++) {
    words = data.replace(/<\/?[^>]*>/g, " ")
    .split(" ")
    .filter((str) => str != '')
    .map((str) => str.toLowerCase())
  }
});