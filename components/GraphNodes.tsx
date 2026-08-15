import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

export const SceneNode = ({ id, data, isConnectable }: any) => {
  const { updateNodeData } = useReactFlow();
  
  return (
    <div className="bg-slate-900 border-2 border-pink-500 rounded-xl p-3 min-w-[250px] shadow-xl shadow-pink-900/20">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-pink-500" />
      <div className="text-[10px] tracking-widest font-bold text-pink-400 mb-2 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
        SCENE NODE
      </div>
      <input
        className="w-full bg-slate-950 text-white text-sm font-semibold rounded-lg p-2 mb-2 border border-slate-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
        value={data.label || ''}
        onChange={(e) => updateNodeData(id, { label: e.target.value })}
        placeholder="Scene Title..."
      />
      <textarea
        className="w-full bg-slate-950 text-slate-300 text-xs rounded-lg p-2 border border-slate-700 h-24 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none resize-none"
        value={data.content || ''}
        onChange={(e) => updateNodeData(id, { content: e.target.value })}
        placeholder="System instructions for this scene... (e.g. 'The character is trapped in a dungeon and must escape.')"
      />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-pink-500" />
    </div>
  );
};

export const ChoiceNode = ({ id, data, isConnectable }: any) => {
  const { updateNodeData } = useReactFlow();
  
  return (
    <div className="bg-slate-900 border-2 border-emerald-500 rounded-xl p-3 min-w-[200px] shadow-xl shadow-emerald-900/20">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-emerald-500" />
      <div className="text-[10px] tracking-widest font-bold text-emerald-400 mb-2 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
        CHOICE / PATH
      </div>
      <input
        className="w-full bg-slate-950 text-white text-sm font-semibold rounded-lg p-2 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        value={data.label || ''}
        onChange={(e) => updateNodeData(id, { label: e.target.value })}
        placeholder="Choice text (e.g. 'Open the door')"
      />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-emerald-500" />
    </div>
  );
};
