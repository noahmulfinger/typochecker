#! /usr/bin/env node
import { Observable } from 'rxjs';
import { argv } from 'yargs';
import * as fs from 'graceful-fs';
import * as readdir from 'recursive-readdir';
var recursiveReadSync = require('recursive-readdir-sync');

interface WordData {
  file: string;
  line: number;
  word: string;
}

function fileFilter(file: string, stats: fs.Stats): boolean {
  return !(stats.isDirectory() || file.endsWith('.html'))
}

function loadWordList(fileName: string): Observable<string[]> {
  console.log('Loading valid word list...')
  return Observable.bindNodeCallback(fs.readFile)(fileName)
    .map(data => data.toString().split('\n').filter(str => str != ''))
}

function readFile(fileName: string): Observable<WordData[]> {
  console.log('Loading file ' + fileName + '...')
  return Observable.bindNodeCallback(fs.readFile)(fileName)
    .map(data => data.toString().toLowerCase().replace(/<\/?[^>]*>/g, " "))
    .map(data => data.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split('\n'))
    .map(lines => {
      let words = [];
      lines.forEach((line, lineNumber) => {
        let arr = line.match(/\w*[^\s]/g)
        if (arr == null) { return; }
        arr.forEach((word) => {
          words.push({ file: fileName, line: lineNumber, word: word });
        })
      })
      return words;
    })
}

function readFiles(files: string[]): Observable<WordData[]> {
  console.log("Files: " + files);
  return Observable.merge(files.map(readFile));
}


function isDirectory(input: string) {
  return Observable.bindNodeCallback(fs.stat)(input)
    .map(stats => stats.isDirectory());
}


function readDir(dir: string): Observable<string[]> {

  return Observable.of(recursiveReadSync(dir).filter((file) => file.endsWith('.html')))

  // Observable.bindNodeCallback(readdir)('./tests',fileFilter).subscribe(data => console.log(data));
  // return Observable.bindNodeCallback(readdir)(dir, fileFilter)
}

function logFileError(err: any) {
  console.log('Error: ' + err.code + ' when attempting to access file or directory ' + err.path);
}


function readInput(input: string): Observable<WordData[]> {
  return isDirectory(input).flatMap(isDir => {
    console.log('Directory? ', isDir);
    if (isDir) {
      return readDir(input).flatMap((files) => readFiles(files));
    } else {
      return readFile(input);
    }
  })
}

Observable.zip(loadWordList(__dirname + '/dict.txt'), readInput(argv._[0])).subscribe(data => {
  let validWords = data[0];
  let fileData = data[1];

  console.log(fileData);

  console.log('Misspelled words:')
  fileData.forEach((wordData) => {
    if (validWords.indexOf(wordData.word) == -1) {
      console.log(wordData.file + ' [line ' + wordData.line + ']: ' + wordData.word);
    }
  })
}, error => {
  console.log(error);
})