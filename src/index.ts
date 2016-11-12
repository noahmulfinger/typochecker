#! /usr/bin/env node
import { Observable } from 'rxjs';
import { argv } from 'yargs';
import * as fs from 'graceful-fs';
import * as readdir from 'recursive-readdir';

interface WordData {
  file: string;
  line: number;
  word: string;
}

function fileFilter(file, stats) {
  return !(stats.isDirectory() || file.endsWith('.html'));
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
        .map(data => data.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split('\n'))
        .map(lines => {
            let words = [];
            lines.forEach((line, lineNumber) => {
                let arr = line.match(/\w*[^\s]/g)
                if (arr == null) { return; }
                arr.forEach((word) => {
                    words.push({file: fileName, line: lineNumber, word: word});
                })
            })
            return words;
        })
}

// readdir('/Users/noah/projects/personal-site/', [fileFilter], (err, files) => {
//   console.log(files);
// });



Observable.zip(loadWordList(__dirname + '/dict.txt'), readFile(argv._[0])).subscribe(data => {
    let validWords = data[0];
    let fileData = data[1];

    console.log('Misspelled words:')
    fileData.forEach((wordData) => {
      if (validWords.indexOf(wordData.word) == -1) {
        console.log(wordData.file + ' [line ' + wordData.line + ']: ' + wordData.word);
      }
    })
})