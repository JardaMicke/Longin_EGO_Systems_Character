const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');

if (!code.includes('isOpen?: boolean;')) {
  // Update interface
  code = code.replace(
    "interface SidebarProps {",
    "interface SidebarProps {\n  isOpen?: boolean;\n  onCloseMobile?: () => void;"
  );

  // Update component signature
  code = code.replace(
    "export const Sidebar: React.FC<SidebarProps> = ({ ",
    "export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile, "
  );

  // Update outer div classes and add overlay
  code = code.replace(
    '<div className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col relative">',
    `<div className={\`fixed md:relative z-40 w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 \${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}\`}>`
  );

  code = code.replace(
    "return (",
    "return (\n    <>\n      {isOpen && <div className=\"fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm\" onClick={onCloseMobile} />}"
  );
  
  // Close the fragment at the end
  const lastDivIndex = code.lastIndexOf("</div>");
  if (lastDivIndex !== -1) {
    code = code.substring(0, lastDivIndex + 6) + "\n    </>" + code.substring(lastDivIndex + 6);
  }

  fs.writeFileSync('components/Sidebar.tsx', code);
  console.log("Sidebar.tsx patched for mobile");
}
