(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.CodiceFiscale = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const {getVowelsArray, getConsonantsArray} = require('./Utils/stringUtils');
const {fillTillLength} = require('./Utils/arrayUtils');
const {internationalize} = require ('./Utils/dateUtils');
const fetch = require('node-fetch');

class Calculator {
  constructor(Person) {
    this.person = Person.data;
  }

  get name() {
    let consonants = getConsonantsArray(this.person.name);
    let vowels = getVowelsArray(this.person.name);
    if(consonants.length > 3) {
      consonants = consonants.filter((char, index) => index !== 1);
    }
    return fillTillLength([...consonants, ...vowels], 3, 'x');
  }

  get lastName() {
    let consonants = getConsonantsArray(this.person.lastName);
    let vowels = getVowelsArray(this.person.lastName);
    return fillTillLength([...consonants, ...vowels], 3, 'x');
  }

  get dateOfBirth() {
    const converted = internationalize(this.person.dateOfBirth);

    let day = converted.getDate();

    if(this.gender && this.gender === 'F') {
      day += 40;
    }

    const monthCodes = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T'];
    return [
      ...converted.getFullYear().toString().substr(2, 2),
      ...monthCodes[converted.getMonth()],
      ...(day.toLocaleString())
    ];
  }

  get placeOfBirth() {
    return new Promise( async (resolve, reject) => {
      let placeCodes = await fetch('https://jsonblob.com/api/jsonBlob/c761f0c2-ecf4-11e8-bcc5-9dc9b6e80c56')
        .then(data => data.json()).catch(error => reject(error));
      resolve(
        Reflect.has(placeCodes, this.person.placeOfBirth.toLocaleUpperCase()) 
          ? [...Reflect.get(placeCodes, this.person.placeOfBirth.toLocaleUpperCase())]
          : [..."XXX"]
      );
    });
  }

  get gender() {
    return this.person.gender;
  }

  checkDigitCalculator(codeArray) {
    const evenValues = 
      '0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25'.split(',');
    const oddValues = 
      '1,0,5,7,9,13,15,17,19,21,1,0,5,7,9,13,15,17,19,21,2,4,18,20,11,3,6,8,12,14,16,10,22,25,24,22'.split(',');
    const digits = [...'0123456789ABCDEFGHIJKLMNOPQRSTUVXYZ'];

    let oddSum = codeArray.reduce(
      (result, char, idx) => { 
        return idx % 2 === 0 
          ? result += Number(oddValues[digits.indexOf(char)])
          : result += 0;
      }, 0
    );

    let evenSum = codeArray.reduce(
      (result, char, idx) => { 
        return idx % 2 === 1 
          ? result += Number(evenValues[digits.indexOf(char)])
          : result += 0;
      }, 0
    );

    return [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'][(oddSum + evenSum) % 26];
  }

  static async generateFiscalCode(Person) {
    const isValid = Person.validate({...Person});

    if(isValid !== true) {
      throw isValid
    }

    const calculatorInstance = new Calculator(Person)
    const preCheckCode = [
      ...calculatorInstance.lastName,
      ...calculatorInstance.name,
      ...calculatorInstance.dateOfBirth,
      ...(await calculatorInstance.placeOfBirth)
    ].map(char => char.toLocaleUpperCase());  
    preCheckCode.push(calculatorInstance.checkDigitCalculator(preCheckCode));
    return preCheckCode.join('');
  }
}

module.exports = Calculator;
},{"./Utils/arrayUtils":3,"./Utils/dateUtils":4,"./Utils/stringUtils":5,"node-fetch":8}],2:[function(require,module,exports){
const validator = require('./Validator');

class Person {
  constructor(name, lastName, dateOfBirth, placeOfBirth, gender) {
    this.name = name;
    this.lastName = lastName;
    this.dateOfBirth = dateOfBirth;
    this.placeOfBirth = placeOfBirth;
    this.gender = gender.toLocaleUpperCase();
  }

  get data () {
    return {...this}
  };

  validate (personData) {
    const errorArray = [];
    Object.keys(personData).forEach(key => {
      if(!validator[key].isValid(personData[key])) {
        errorArray.push({
          [key]: {
            message: validator[key].message
          }
        })
      }
    })
    if(errorArray.length === 0){
      return true;
    } else {
      return errorArray;
    }
    
  }
}

//export default { Person };
module.exports = Person;
},{"./Validator":6}],3:[function(require,module,exports){
module.exports = {
  fillTillLength(array, newLength, element) {
    while(array.length < newLength) {
      array.push(element);
    }
    array.length = newLength;
    return array
  }
}
},{}],4:[function(require,module,exports){
module.exports = {
  internationalize (date) {
    let dateObj = new Date(date);
    if(dateObj instanceof Date && !isNaN(dateObj)) {
      return dateObj;
    }
    return new Date(date.split('/').reverse().join('-'));
  }
}
},{}],5:[function(require,module,exports){
module.exports = {
  getVowelsArray (string, orderRelation) {
    const vowels = [...string.toLocaleLowerCase()]
      .filter(char => ['a', 'e', 'i', 'o', 'u'].includes(char));
    return orderRelation && typeof orderRelation === 'function' 
      ? vowels.sort(orderRelation)
      : vowels;
  },

  getConsonantsArray (string, orderRelation) {
    const consonants = [...string.toLocaleLowerCase()]
      .filter(char => !['a', 'e', 'i', 'o', 'u'].includes(char));
    return orderRelation && typeof orderRelation === 'function' 
      ? consonants.sort(orderRelation)
      : consonants
  }
}
},{}],6:[function(require,module,exports){
module.exports = {
  name: { 
    isValid: (value) => value && typeof value === 'string' && isNaN(parseInt(value)),
    message: "Il nome deve essere una stringa"
  },
  lastName: { 
    isValid: (value) => value && typeof value === 'string' && isNaN(parseInt(value)),
    message: "Il cognome deve essere una stringa"
  },
  dateOfBirth: { 
    isValid: (value) => value && (
      value.match(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/)
      || value.match(/^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/)
    ),
    message: "La data di nascita deve essere nel formato DD/MM/YYYY oppure YYYY/MM/DD"
  },
  placeOfBirth: { 
    isValid: (value) => value && typeof value === 'string' && isNaN(parseInt(value)),
    message: "Il comune di nascita deve essere una stringa"
  },
  gender: {
    isValid: (value) => {
      switch(value) {
        case 'M':
        case 'F':
          return true;
        default: 
          return false;
      }
    },
    message: "Il sesso deve essere o uomo o donna"
  }
}
},{}],7:[function(require,module,exports){
const Person = require('./Person');
const Calculator = require('./Calculator');


const CalculateFiscalNumber = async (name, lastName, dateOfBirth, placeOfBirth, gender) => {
  try {
    const code = await Calculator.generateFiscalCode(
      new Person(name, lastName, dateOfBirth, placeOfBirth, gender)
    )
    return code;
  } catch (error) {
    throw error;
  }
}

module.exports = CalculateFiscalNumber;

},{"./Calculator":1,"./Person":2}],8:[function(require,module,exports){
"use strict";

// ref: https://github.com/tc39/proposal-global
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof global !== 'undefined') { return global; }
	throw new Error('unable to locate global object');
}

var global = getGlobal();

module.exports = exports = global.fetch;

// Needed for TypeScript and Webpack.
exports.default = global.fetch.bind(global);

exports.Headers = global.Headers;
exports.Request = global.Request;
exports.Response = global.Response;
},{}]},{},[7])(7)
});
