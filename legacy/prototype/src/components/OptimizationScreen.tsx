import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Settings, Play, ArrowRight, BrainCircuit, LineChart, Cpu } from 'lucide-react';

export default function OptimizationScreen() {
  const { state } = useAppContext();
  const [selectedScenario, setSelectedScenario] = useState(state.scenarios[0]?.id || '');
  const [objective, setObjective] = useState('maximize_throughput');
  const [variables, setVariables] = useState<string[]>([]);
  const [optimizationModel, setOptimizationModel] = useState('ml_model');
  const [status, setStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  const handleRun = () => {
    setStatus('running');
    setTimeout(() => {
      setStatus('completed');
    }, 3000);
  };

  const getModelIcon = () => {
    switch (optimizationModel) {
      case 'ml_model': return <BrainCircuit className="w-5 h-5 text-indigo-500" />;
      case 'linear_opt': return <LineChart className="w-5 h-5 text-emerald-500" />;
      case 'heuristic': return <Cpu className="w-5 h-5 text-amber-500" />;
      default: return <Settings className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getModelName = () => {
    switch (optimizationModel) {
      case 'ml_model': return 'Machine Learning Model';
      case 'linear_opt': return 'Linear Optimization';
      case 'heuristic': return 'Heuristic Search';
      default: return 'Optimization';
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Optimization Setup</h2>
        <p className="text-neutral-500 mt-1">Define objectives and constraints to find the best configuration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
              {getModelIcon()}
              Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Base Scenario</label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                >
                  {state.scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Optimization Model</label>
                <select
                  value={optimizationModel}
                  onChange={(e) => setOptimizationModel(e.target.value)}
                  className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="ml_model">Machine Learning (Predictive)</option>
                  <option value="linear_opt">Linear Programming (Exact)</option>
                  <option value="heuristic">Genetic Algorithm (Heuristic)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Objective</label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="maximize_throughput">Maximize Throughput</option>
                  <option value="minimize_cycle_time">Minimize Cycle Time</option>
                  <option value="minimize_cost">Minimize Cost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Tunable Variables</label>
                <div className="space-y-2">
                  {['Staffing Level', 'Batch Size', 'Job Priority'].map(v => (
                    <label key={v} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={variables.includes(v)}
                        onChange={(e) => {
                          if (e.target.checked) setVariables([...variables, v]);
                          else setVariables(variables.filter(x => x !== v));
                        }}
                        className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-neutral-600">{v}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRun}
                disabled={status === 'running'}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {status === 'running' ? 'Optimizing...' : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Optimization
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {status === 'idle' && (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50 p-12 text-center">
              <div>
                <Settings className="mx-auto h-12 w-12 text-neutral-400" />
                <h3 className="mt-2 text-sm font-medium text-neutral-900">No optimization run</h3>
                <p className="mt-1 text-sm text-neutral-500">Configure settings and run to see recommendations.</p>
              </div>
            </div>
          )}

          {status === 'running' && (
            <div className="h-full flex items-center justify-center border border-neutral-200 rounded-lg bg-white p-12 text-center shadow">
              <div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <h3 className="mt-4 text-sm font-medium text-neutral-900">Running {getModelName()}...</h3>
                <p className="mt-1 text-sm text-neutral-500">Evaluating combinations to {objective.replace('_', ' ')}.</p>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="bg-white rounded-lg shadow border border-neutral-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-200 bg-emerald-50">
                <h3 className="text-lg font-medium text-emerald-800">Optimization Complete</h3>
                <p className="text-sm text-emerald-600 mt-1">Found a configuration that improves throughput by 18% using {getModelName()}.</p>
              </div>
              
              <div className="p-6">
                <h4 className="text-sm font-medium text-neutral-900 mb-4">Recommended Changes</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-md border border-neutral-200">
                    <div className="text-sm font-medium text-neutral-700">Staffing Level (Technician)</div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-neutral-500 line-through">5</span>
                      <ArrowRight className="w-4 h-4 text-neutral-400" />
                      <span className="font-bold text-emerald-600">7</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-md border border-neutral-200">
                    <div className="text-sm font-medium text-neutral-700">Batch Size (Assembly)</div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-neutral-500 line-through">10</span>
                      <ArrowRight className="w-4 h-4 text-neutral-400" />
                      <span className="font-bold text-emerald-600">15</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-sm font-medium text-neutral-900 mb-4">Expected Impact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-neutral-200 rounded-md">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">Throughput</div>
                      <div className="mt-1 text-2xl font-semibold text-emerald-600">142 <span className="text-sm font-normal text-emerald-500">(+18%)</span></div>
                    </div>
                    <div className="p-4 border border-neutral-200 rounded-md">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">Cycle Time</div>
                      <div className="mt-1 text-2xl font-semibold text-emerald-600">38m <span className="text-sm font-normal text-emerald-500">(-15%)</span></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Apply to New Scenario
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
