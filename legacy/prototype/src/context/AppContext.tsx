import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Node, Edge } from '@xyflow/react';

export type Resource = {
  id: string;
  name: string;
  capacity: number;
  cost?: number;
  category?: string;
  properties?: Record<string, string>;
};

export type Entity = {
  id: string;
  name: string;
  group?: string;
  variants: string[];
};

export type Project = {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
};

export type Scenario = {
  id: string;
  projectId: string;
  name: string;
  overrides: Record<string, any>;
};

export type RunResult = {
  throughput: number;
  cycleTime: number;
  utilization: number;
  queueLength: number;
};

export type Run = {
  id: string;
  scenarioId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: RunResult;
};

interface AppState {
  projects: Project[];
  resources: Resource[];
  entities: Entity[];
  scenarios: Scenario[];
  runs: Run[];
  resourceCategories: string[];
  entityGroups: string[];
}

interface AppContextType {
  state: AppState;
  addProject: (name: string) => void;
  updateProject: (id: string, nodes: Node[], edges: Edge[]) => void;
  deleteProject: (id: string) => void;
  addResource: (resource: Omit<Resource, 'id'>) => void;
  updateResource: (id: string, resource: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  addResourceCategory: (category: string) => void;
  addEntity: (entity: Omit<Entity, 'id'>) => void;
  addEntities: (entities: Omit<Entity, 'id'>[]) => void;
  updateEntity: (id: string, entity: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  addEntityGroup: (group: string) => void;
  addScenario: (projectId: string, name: string) => void;
  runScenario: (scenarioId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>({
    projects: [
      {
        id: 'p1',
        name: 'Factory Assembly Line',
        nodes: [
          { id: '1', type: 'source', position: { x: 100, y: 100 }, data: { label: 'Raw Materials' } },
          { id: '2', type: 'queue', position: { x: 300, y: 100 }, data: { label: 'Buffer' } },
          { id: '3', type: 'process', position: { x: 500, y: 100 }, data: { label: 'Assembly' } },
          { id: '4', type: 'sink', position: { x: 700, y: 100 }, data: { label: 'Finished Goods' } },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', target: '4' },
        ],
      }
    ],
    resources: [
      { id: 'r1', name: 'Assembler Robot', capacity: 2, cost: 50, category: 'Machine', properties: { 'Maintenance Interval': '100h' } },
      { id: 'r2', name: 'Technician', capacity: 5, cost: 30, category: 'Worker', properties: { 'Shift': 'Day' } },
    ],
    entities: [
      { id: 'e1', name: 'Widget', group: 'Finished Goods', variants: ['Standard', 'Premium'] },
    ],
    scenarios: [
      { id: 's1', projectId: 'p1', name: 'Baseline', overrides: {} },
      { id: 's2', projectId: 'p1', name: 'High Demand (+20%)', overrides: { arrivalRate: 1.2 } },
    ],
    runs: [
      { id: 'run1', scenarioId: 's1', status: 'completed', results: { throughput: 120, cycleTime: 45, utilization: 0.85, queueLength: 12 } },
    ],
    resourceCategories: ['Machine', 'Worker', 'Station', 'Vehicle', 'Room'],
    entityGroups: ['Finished Goods', 'Raw Materials', 'WIP'],
  });

  const addProject = (name: string) => {
    setState(s => ({ ...s, projects: [...s.projects, { id: uuidv4(), name, nodes: [], edges: [] }] }));
  };

  const updateProject = (id: string, nodes: Node[], edges: Edge[]) => {
    setState(s => ({
      ...s,
      projects: s.projects.map(p => p.id === id ? { ...p, nodes, edges } : p)
    }));
  };

  const deleteProject = (id: string) => {
    setState(s => ({ ...s, projects: s.projects.filter(p => p.id !== id) }));
  };

  const addResource = (resource: Omit<Resource, 'id'>) => {
    setState(s => ({ ...s, resources: [...s.resources, { ...resource, id: uuidv4() }] }));
  };

  const updateResource = (id: string, resource: Partial<Resource>) => {
    setState(s => ({
      ...s,
      resources: s.resources.map(r => r.id === id ? { ...r, ...resource } : r)
    }));
  };

  const deleteResource = (id: string) => {
    setState(s => ({ ...s, resources: s.resources.filter(r => r.id !== id) }));
  };

  const addResourceCategory = (category: string) => {
    setState(s => {
      if (s.resourceCategories.includes(category)) return s;
      return { ...s, resourceCategories: [...s.resourceCategories, category] };
    });
  };

  const addEntity = (entity: Omit<Entity, 'id'>) => {
    setState(s => ({ ...s, entities: [...s.entities, { ...entity, id: uuidv4() }] }));
  };

  const addEntities = (entities: Omit<Entity, 'id'>[]) => {
    const newEntities = entities.map(e => ({ ...e, id: uuidv4() }));
    setState(s => ({ ...s, entities: [...s.entities, ...newEntities] }));
  };

  const updateEntity = (id: string, entity: Partial<Entity>) => {
    setState(s => ({
      ...s,
      entities: s.entities.map(e => e.id === id ? { ...e, ...entity } : e)
    }));
  };

  const deleteEntity = (id: string) => {
    setState(s => ({ ...s, entities: s.entities.filter(e => e.id !== id) }));
  };

  const addEntityGroup = (group: string) => {
    setState(s => {
      if (s.entityGroups.includes(group)) return s;
      return { ...s, entityGroups: [...s.entityGroups, group] };
    });
  };

  const addScenario = (projectId: string, name: string) => {
    setState(s => ({ ...s, scenarios: [...s.scenarios, { id: uuidv4(), projectId, name, overrides: {} }] }));
  };

  const runScenario = (scenarioId: string) => {
    const runId = uuidv4();
    setState(s => ({ ...s, runs: [...s.runs, { id: runId, scenarioId, status: 'running' }] }));
    
    // Simulate run
    setTimeout(() => {
      setState(s => ({
        ...s,
        runs: s.runs.map(r => r.id === runId ? {
          ...r,
          status: 'completed',
          results: {
            throughput: Math.floor(Math.random() * 50) + 100,
            cycleTime: Math.floor(Math.random() * 20) + 30,
            utilization: Math.random() * 0.4 + 0.5,
            queueLength: Math.floor(Math.random() * 10) + 2,
          }
        } : r)
      }));
    }, 2000);
  };

  return (
    <AppContext.Provider value={{ state, addProject, updateProject, deleteProject, addResource, updateResource, deleteResource, addResourceCategory, addEntity, addEntities, updateEntity, deleteEntity, addEntityGroup, addScenario, runScenario }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
