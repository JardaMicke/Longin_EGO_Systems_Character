import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MiniMap,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Scenario } from '../types';
import { SceneNode, ChoiceNode } from './GraphNodes';

interface Props {
  scenario: Scenario;
  onClose: () => void;
  onSave: (scenario: Scenario) => void;
}

const initialNodes: Node[] = [
  { id: 'start_node', type: 'scene', position: { x: 250, y: 50 }, data: { label: 'Prologue', content: 'The adventure begins...' } },
];
const initialEdges: Edge[] = [];

const FlowCanvas = ({ scenario, onClose, onSave, nodeTypes }: any) => {
  const [nodes, setNodes] = useState<Node[]>(scenario.nodes?.length ? scenario.nodes : initialNodes);
  const [edges, setEdges] = useState<Edge[]>(scenario.edges?.length ? scenario.edges : initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const handleSave = () => {
    onSave({ ...scenario, nodes, edges });
    onClose();
  };

  const handleAddNode = (type: 'scene' | 'choice') => {
    const newNode: Node = {
      id: Math.random().toString(36).substr(2, 9),
      type: type,
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: type === 'scene' ? 'New Scene' : 'New Choice', content: '' }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 shadow-2xl overflow-hidden relative">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
             </svg>
             Graph Editor: {scenario.title}
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleAddNode('scene')}
              className="px-4 py-2 bg-pink-600/20 hover:bg-pink-600 text-pink-400 hover:text-white rounded-lg text-sm font-semibold transition-all border border-pink-600/30"
            >
              + Scene
            </button>
            <button
              onClick={() => handleAddNode('choice')}
              className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-sm font-semibold transition-all border border-emerald-600/30"
            >
              + Choice
            </button>
            <div className="w-px h-8 bg-slate-700 mx-2 self-center"></div>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-white text-black hover:bg-slate-200 rounded-lg text-sm font-bold transition-all shadow-lg"
            >
              Save Graph
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-900"
          >
            <Background color="#334155" gap={16} />
            <Controls className="bg-slate-800 border-slate-700 text-slate-300 fill-slate-300" />
            <MiniMap className="bg-slate-800 border-slate-700 mask-rect" nodeColor={(n) => n.type === 'scene' ? '#ec4899' : '#10b981'} />
          </ReactFlow>
        </div>
      </div>
  );
}

export const ScenarioGraphEditor: React.FC<Props> = ({ scenario, onClose, onSave }) => {
  const nodeTypes = useMemo(() => ({ scene: SceneNode, choice: ChoiceNode }), []);

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/90 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <ReactFlowProvider>
        <FlowCanvas scenario={scenario} onClose={onClose} onSave={onSave} nodeTypes={nodeTypes} />
      </ReactFlowProvider>
    </div>
  );
};
