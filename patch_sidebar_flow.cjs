const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');

if (!code.includes("onOpenGraphEditor?: (scenario: Scenario) => void;")) {
  code = code.replace("onEditScenario?: (scenario: Scenario) => void;", "onEditScenario?: (scenario: Scenario) => void;\n  onOpenGraphEditor?: (scenario: Scenario) => void;");
}

const graphBtn = `
                  {onOpenGraphEditor && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGraphEditor(scenario);
                      }}
                      className="p-2 hover:bg-emerald-900/30 rounded-lg transition-all text-slate-400 hover:text-emerald-500"
                      title="Open Graph Editor"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6m-6 4h6m-6 4h6" />
                      </svg>
                    </button>
                  )}
`;

if (!code.includes("onOpenGraphEditor(scenario)")) {
  code = code.replace("{onEditScenario && (", graphBtn + "\n                  {onEditScenario && (");
  fs.writeFileSync('components/Sidebar.tsx', code);
  console.log("Sidebar patched");
}
