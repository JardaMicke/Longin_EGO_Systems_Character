const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

// 1. Update Props
if (!code.includes("currentNodeId?: string;")) {
  code = code.replace(
    "statusMessage?: string;",
    "statusMessage?: string;\n  currentNodeId?: string;\n  onNodeTransition?: (nodeId: string) => void;"
  );
  
  // 2. Destructure new props
  code = code.replace(
    "statusMessage",
    "statusMessage,\n  currentNodeId,\n  onNodeTransition"
  );
}

// 3. Render Node State Header
const nodeHeaderCode = `
      {/* Node State Bar */}
      {scenario && scenario.nodes && scenario.nodes.length > 0 && (
        <div className="bg-slate-900 border-b border-slate-800 p-2 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-pink-500 flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            <span className="text-slate-400 font-semibold uppercase tracking-widest text-[9px]">Current Scene:</span>
            <span className="text-white font-bold">
              {(() => {
                 const node = scenario.nodes.find(n => n.id === currentNodeId);
                 if (node) return node.data.label;
                 const startNode = scenario.nodes.find(n => n.id === 'start_node') || scenario.nodes[0];
                 return startNode ? startNode.data.label : 'Unknown';
              })()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase tracking-widest text-[8px] font-bold mr-1">Available Paths:</span>
            {(() => {
               // Find active node
               let activeNodeId = currentNodeId;
               if (!activeNodeId) {
                  const startNode = scenario.nodes.find(n => n.id === 'start_node') || scenario.nodes[0];
                  if (startNode) activeNodeId = startNode.id;
               }
               
               // Find edges from this node
               const connectedEdges = scenario.edges?.filter(e => e.source === activeNodeId) || [];
               
               if (connectedEdges.length === 0) {
                 return <span className="text-slate-600 italic">None</span>;
               }
               
               return connectedEdges.map(edge => {
                 const targetNode = scenario.nodes.find(n => n.id === edge.target);
                 if (!targetNode) return null;
                 
                 const isChoice = targetNode.type === 'choice';
                 
                 return (
                   <button
                     key={edge.id}
                     onClick={() => onNodeTransition && onNodeTransition(targetNode.id)}
                     className={\`px-2 py-1 rounded text-[10px] font-bold transition-all \${isChoice ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-600/30' : 'bg-pink-600/20 text-pink-400 hover:bg-pink-600 hover:text-white border border-pink-600/30'}\`}
                   >
                     {targetNode.data.label || 'Next Scene'}
                   </button>
                 );
               });
            })()}
          </div>
        </div>
      )}
`;

if (!code.includes("Current Scene:")) {
  // Find where to insert it. Below the Chat header.
  // The header ends with `</header>` or similar.
  // Let's search for `<div className="flex-1 overflow-y-auto p-4 space-y-4">`
  code = code.replace(
    '<div className="flex-1 overflow-y-auto p-4 space-y-4">',
    nodeHeaderCode + '\n      <div className="flex-1 overflow-y-auto p-4 space-y-4">'
  );
  
  fs.writeFileSync('components/ChatWindow.tsx', code);
  console.log("ChatWindow patched with node UI");
}
