const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const files=['index.html','styles.css','score-engine.js','app.js','sw.js','icon.svg','manifest.webmanifest'];
for(const file of files) {if(file.endsWith('.js')) new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});}
JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
fs.mkdirSync('out',{recursive:true});for(const file of files)fs.copyFileSync(file,path.join('out',file));
fs.writeFileSync('out/.nojekyll','');console.log('Build listo: 7 archivos, sin dependencias externas.');
