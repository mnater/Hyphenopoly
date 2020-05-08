/* eslint-env node */
"use strict";
const h = require("./calculateBaseData.js");

const fs = require("fs");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const data = fs.readFileSync(process.argv[2]);
const baseData = h.calculateBaseData(data);

let imports = "";
imports += `export const to: i32 = ${baseData.to};\n`;
imports += `export const po: i32 = ${baseData.po};\n`;
imports += `export const pl: i32 = ${baseData.pl};\n`;
imports += `export const vs: i32 = ${baseData.vs};\n`;
imports += `export const pt: i32 = ${baseData.pt};\n`;
imports += `export const wo: i32 = ${baseData.wo};\n`;
imports += `export const tw: i32 = ${baseData.tw};\n`;
imports += `export const hp: i32 = ${baseData.hp};\n`;
imports += `export const hw: i32 = ${baseData.hw};\n`;
imports += `export const lm: i32 = ${baseData.lm};\n`;
imports += `export const rm: i32 = ${baseData.rm};\n`;

process.stdout.write(imports);
