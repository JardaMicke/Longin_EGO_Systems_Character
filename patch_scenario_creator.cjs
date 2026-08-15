const fs = require('fs');
let code = fs.readFileSync('components/ScenarioCreator.tsx', 'utf8');

if (!code.includes("import { DocumentUploader }")) {
  code = code.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { DocumentUploader } from './DocumentUploader';"
  );
}

const uploaderCode = `
          {scenario?.id && (
            <div className="mt-6">
              <DocumentUploader entityId={scenario.id} />
            </div>
          )}
          
          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-800">
`;

if (!code.includes("<DocumentUploader")) {
  code = code.replace(
    "<div className=\"flex gap-3 pt-6 mt-6 border-t border-slate-800\">",
    uploaderCode
  );
  fs.writeFileSync('components/ScenarioCreator.tsx', code);
  console.log("ScenarioCreator patched with DocumentUploader");
}
