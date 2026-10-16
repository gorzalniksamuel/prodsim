import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, GitBranch, Play } from 'lucide-react';

export default function ScenarioEditor() {
  const { state, addScenario, runScenario } = useAppContext();
  const [newScenarioName, setNewScenarioName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(state.projects[0]?.id || '');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newScenarioName.trim() && selectedProjectId) {
      addScenario(selectedProjectId, newScenarioName.trim());
      setNewScenarioName('');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Scenarios</h2>
          <p className="text-neutral-500 mt-1">Clone projects and change assumptions to compare outcomes.</p>
        </div>
        <form onSubmit={handleAdd} className="flex gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input
            type="text"
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            placeholder="New scenario name..."
            className="px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {state.scenarios.map((scenario) => {
          const project = state.projects.find(p => p.id === scenario.projectId);
          return (
            <div key={scenario.id} className="bg-white overflow-hidden shadow rounded-lg border border-neutral-200">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-lg font-medium text-neutral-900 truncate">{scenario.name}</h3>
                </div>
                <p className="text-sm text-neutral-500 mb-4">Base Project: {project?.name || 'Unknown'}</p>
                
                <div className="bg-neutral-50 p-3 rounded-md text-sm text-neutral-700 mb-4 h-24 overflow-y-auto border border-neutral-100">
                  <div className="font-medium mb-1">Overrides:</div>
                  {Object.keys(scenario.overrides).length > 0 ? (
                    <ul className="list-disc pl-4">
                      {Object.entries(scenario.overrides).map(([k, v]) => (
                        <li key={k}>{k}: {JSON.stringify(v)}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-neutral-400 italic">No overrides (Baseline)</span>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4">
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Edit Overrides
                  </button>
                  <button
                    onClick={() => runScenario(scenario.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Run
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
