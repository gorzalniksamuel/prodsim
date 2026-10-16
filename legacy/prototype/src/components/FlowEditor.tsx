import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  Node,
  Edge,
  Connection,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../context/AppContext';
import { Settings, Play, Save, Box, ArrowRight, Layers, LogIn, LogOut, Clock, Users, CheckCircle } from 'lucide-react';

const nodeTypes = {
  source: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-emerald-500 min-w-[120px]">
      <div className="flex items-center gap-2"><LogIn className="w-4 h-4 text-emerald-500" /><div className="font-bold text-sm">{data.label}</div></div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500" />
    </div>
  ),
  queue: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-amber-500 min-w-[120px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500" />
      <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-amber-500" /><div className="font-bold text-sm">{data.label}</div></div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-amber-500" />
    </div>
  ),
  process: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-indigo-500 min-w-[120px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500" />
      <div className="flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-500" /><div className="font-bold text-sm">{data.label}</div></div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500" />
    </div>
  ),
  decision: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-purple-500 min-w-[120px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />
      <div className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-purple-500" /><div className="font-bold text-sm">{data.label}</div></div>
      <Handle type="source" position={Position.Right} id="true" className="w-3 h-3 bg-purple-500 top-1/3" />
      <Handle type="source" position={Position.Right} id="false" className="w-3 h-3 bg-purple-500 top-2/3" />
    </div>
  ),
  batch: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-500 min-w-[120px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
      <div className="flex items-center gap-2"><Box className="w-4 h-4 text-blue-500" /><div className="font-bold text-sm">{data.label}</div></div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
    </div>
  ),
  sink: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-rose-500 min-w-[120px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-rose-500" />
      <div className="flex items-center gap-2"><LogOut className="w-4 h-4 text-rose-500" /><div className="font-bold text-sm">{data.label}</div></div>
    </div>
  ),
};

const defaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: '#9ca3af' },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
};

function FlowEditorContent({ projectId }: { projectId: string }) {
  const { state, updateProject } = useAppContext();
  const project = state.projects.find(p => p.id === projectId);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(project?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(project?.edges || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = {
        x: event.clientX - (reactFlowWrapper.current?.getBoundingClientRect().left || 0),
        y: event.clientY - (reactFlowWrapper.current?.getBoundingClientRect().top || 0),
      };

      const newNode: Node = {
        id: uuidv4(),
        type,
        position,
        data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  const handleSave = () => {
    updateProject(projectId, nodes, edges);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  const updateNodeData = (id: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, ...newData };
        }
        return node;
      })
    );
    if (selectedNode && selectedNode.id === id) {
      setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...newData } });
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Node Palette */}
      <div className="w-64 bg-white border-r border-neutral-200 p-4 flex flex-col gap-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Nodes</h3>
        <div className="space-y-2">
          <div className="p-3 border-2 border-emerald-200 bg-emerald-50 rounded cursor-grab hover:border-emerald-400 transition-colors flex items-center gap-2" onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'source')} draggable>
            <LogIn className="w-4 h-4 text-emerald-600" /> <span className="text-sm font-medium text-emerald-900">Source</span>
          </div>
          <div className="p-3 border-2 border-amber-200 bg-amber-50 rounded cursor-grab hover:border-amber-400 transition-colors flex items-center gap-2" onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'queue')} draggable>
            <Layers className="w-4 h-4 text-amber-600" /> <span className="text-sm font-medium text-amber-900">Queue</span>
          </div>
          <div className="p-3 border-2 border-indigo-200 bg-indigo-50 rounded cursor-grab hover:border-indigo-400 transition-colors flex items-center gap-2" onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'process')} draggable>
            <Settings className="w-4 h-4 text-indigo-600" /> <span className="text-sm font-medium text-indigo-900">Process</span>
          </div>
          <div className="p-3 border-2 border-purple-200 bg-purple-50 rounded cursor-grab hover:border-purple-400 transition-colors flex items-center gap-2" onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'decision')} draggable>
            <ArrowRight className="w-4 h-4 text-purple-600" /> <span className="text-sm font-medium text-purple-900">Decision</span>
          </div>
          <div className="p-3 border-2 border-blue-200 bg-blue-50 rounded cursor-grab hover:border-blue-400 transition-colors flex items-center gap-2" onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'batch')} draggable>
            <Box className="w-4 h-4 text-blue-600" /> <span className="text-sm font-medium text-blue-900">Batch</span>
          </div>
          <div className="p-3 border-2 border-rose-200 bg-rose-50 rounded cursor-grab hover:border-rose-400 transition-colors flex items-center gap-2" onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'sink')} draggable>
            <LogOut className="w-4 h-4 text-rose-600" /> <span className="text-sm font-medium text-rose-900">Sink</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
        >
          <Background color="#ccc" gap={16} />
          <Controls />
          <Panel position="top-right" className="flex gap-2">
            <button onClick={handleSave} className={`flex items-center gap-2 px-4 py-2 text-white rounded-md shadow transition-colors text-sm font-medium ${isSaved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />} 
              {isSaved ? 'Saved!' : 'Save Model'}
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 bg-white border-l border-neutral-200 p-6 overflow-y-auto flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-neutral-500" />
              Node Configuration
            </h3>
            <p className="text-sm text-neutral-500 mt-1">Type: <span className="capitalize font-medium text-neutral-700">{selectedNode.type}</span></p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Label</label>
              <input
                type="text"
                value={selectedNode.data.label as string}
                onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            {selectedNode.type === 'process' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Duration (mins)</label>
                  <input
                    type="number"
                    value={(selectedNode.data.config as any)?.duration || 10}
                    onChange={(e) => updateNodeData(selectedNode.id, { config: { ...(selectedNode.data.config as any), duration: parseInt(e.target.value) } })}
                    className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-2"><Users className="w-4 h-4" /> Required Resource</label>
                  <select
                    value={(selectedNode.data.config as any)?.resourceId || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { config: { ...(selectedNode.data.config as any), resourceId: e.target.value } })}
                    className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  >
                    <option value="">None</option>
                    {state.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </>
            )}

            {selectedNode.type === 'queue' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Capacity (0 = infinite)</label>
                <input
                  type="number"
                  value={(selectedNode.data.config as any)?.capacity || 0}
                  onChange={(e) => updateNodeData(selectedNode.id, { config: { ...(selectedNode.data.config as any), capacity: parseInt(e.target.value) } })}
                  className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            )}
            
            {selectedNode.type === 'source' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Arrival Rate (per hour)</label>
                <input
                  type="number"
                  value={(selectedNode.data.config as any)?.arrivalRate || 10}
                  onChange={(e) => updateNodeData(selectedNode.id, { config: { ...(selectedNode.data.config as any), arrivalRate: parseInt(e.target.value) } })}
                  className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlowEditor({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <FlowEditorContent projectId={projectId} />
    </ReactFlowProvider>
  );
}
