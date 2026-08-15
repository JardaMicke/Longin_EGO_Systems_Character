const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  '          statusMessage={statusMessage}\\n',
  '          statusMessage={statusMessage}\n'
);

fs.writeFileSync('App.tsx', code);
