const fs = require('fs');
const path = require('path');

// This script simulates what Gradle Buildship does during Android builds
// It creates .project files in nested node_modules without package.json

const nestedPath = path.join(__dirname, 'node_modules/expo/node_modules/expo-modules-core');
const androidPath = path.join(nestedPath, 'android');
const pluginPath = path.join(nestedPath, 'expo-module-gradle-plugin');

// Create directories
fs.mkdirSync(androidPath, { recursive: true });
fs.mkdirSync(pluginPath, { recursive: true });

// Create .project files (what Gradle Buildship creates)
const projectContent = `<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
  <name>expo-modules-core</name>
  <comment>Project expo-modules-core created by Buildship.</comment>
  <projects></projects>
  <buildSpec>
    <buildCommand>
      <name>org.eclipse.buildship.core.gradleprojectbuilder</name>
    </buildCommand>
  </buildSpec>
  <natures>
    <nature>org.eclipse.buildship.core.gradleprojectnature</nature>
  </natures>
</projectDescription>`;

fs.writeFileSync(path.join(androidPath, '.project'), projectContent);
fs.writeFileSync(path.join(pluginPath, '.project'), projectContent);

console.log('Created fake nested expo-modules-core folder (simulating Gradle Buildship)');
console.log('');
console.log('Structure:');
console.log('node_modules/expo/node_modules/expo-modules-core/');
console.log('├── android/');
console.log('│   └── .project');
console.log('└── expo-module-gradle-plugin/');
console.log('    └── .project');
console.log('');
console.log('Note: NO package.json in this folder!');
