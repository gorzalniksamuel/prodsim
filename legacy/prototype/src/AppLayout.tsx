import React, { useState } from 'react';
import { LayoutDashboard, Network, Users, Box, GitBranch, PlayCircle, BarChart2, Settings } from 'lucide-react';
import { cn } from './lib/utils';
import { AppProvider } from './context/AppContext';
import ProjectList from './components/ProjectList';
import FlowEditor from './components/FlowEditor';
import ResourceLibrary from './components/ResourceLibrary';
import EntityLibrary from './components/EntityLibrary';
import ScenarioEditor from './components/ScenarioEditor';
import RunScreen from './components/RunScreen';
import ResultsDashboard from './components/ResultsDashboard';
import OptimizationScreen from './components/OptimizationScreen';

type View = 'projects' | 'editor' | 'resources' | 'entities' | 'scenarios' | 'runs' | 'results' | 'optimization';

export default function AppLayout() {
  const [currentView, setCurrentView] = useState<View>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const navItems = [
    { id: 'projects', label: 'Projects', icon: LayoutDashboard },
    { id: 'editor', label: 'Flow Editor', icon: Network, disabled: !selectedProjectId },
    { id: 'resources', label: 'Resources', icon: Users },
    { id: 'entities', label: 'Entities', icon: Box },
    { id: 'scenarios', label: 'Scenarios', icon: GitBranch },
    { id: 'runs', label: 'Simulation Runs', icon: PlayCircle },
    { id: 'results', label: 'Results', icon: BarChart2 },
    { id: 'optimization', label: 'Optimization', icon: Settings },
  ] as const;

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setCurrentView('editor');
  };

  return (
    <AppProvider>
      <div className="flex h-screen bg-neutral-50 text-neutral-900 font-sans">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
          <div className="p-4 border-b border-neutral-200">
            <h1 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
              <Network className="w-6 h-6 text-indigo-600" />
              SimPy Studio
            </h1>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setCurrentView(item.id as View)}
                  disabled={item.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    currentView === item.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentView === 'projects' && <ProjectList onSelectProject={handleSelectProject} />}
          {currentView === 'editor' && selectedProjectId && <FlowEditor projectId={selectedProjectId} />}
          {currentView === 'resources' && <ResourceLibrary />}
          {currentView === 'entities' && <EntityLibrary />}
          {currentView === 'scenarios' && <ScenarioEditor />}
          {currentView === 'runs' && <RunScreen />}
          {currentView === 'results' && <ResultsDashboard />}
          {currentView === 'optimization' && <OptimizationScreen />}
        </main>
      </div>
    </AppProvider>
  );
}
