import React from 'react';
import { useAppContext } from '../context/AppContext';
import { PlayCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function RunScreen() {
  const { state, runScenario } = useAppContext();

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Simulation Runs</h2>
          <p className="text-neutral-500 mt-1">Monitor the status of your discrete-event simulations.</p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-neutral-200">
          {state.runs.map((run) => {
            const scenario = state.scenarios.find(s => s.id === run.scenarioId);
            const project = state.projects.find(p => p.id === scenario?.projectId);
            
            return (
              <li key={run.id} className="px-4 py-4 sm:px-6 hover:bg-neutral-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {run.status === 'completed' && <CheckCircle className="h-6 w-6 text-emerald-500" />}
                      {run.status === 'running' && <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />}
                      {run.status === 'failed' && <XCircle className="h-6 w-6 text-red-500" />}
                      {run.status === 'pending' && <PlayCircle className="h-6 w-6 text-neutral-400" />}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-indigo-600 truncate">
                        {scenario?.name || 'Unknown Scenario'}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-neutral-500">
                        <span>Project: {project?.name || 'Unknown'}</span>
                        <span className="mx-2">&middot;</span>
                        <span className="capitalize">Status: {run.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-5 flex-shrink-0">
                    {run.status === 'completed' && run.results && (
                      <div className="text-sm text-neutral-700 grid grid-cols-2 gap-x-4 gap-y-1 text-right">
                        <div>Throughput: <span className="font-semibold">{run.results.throughput}</span></div>
                        <div>Cycle Time: <span className="font-semibold">{run.results.cycleTime}</span></div>
                        <div>Utilization: <span className="font-semibold">{(run.results.utilization * 100).toFixed(1)}%</span></div>
                        <div>Queue: <span className="font-semibold">{run.results.queueLength}</span></div>
                      </div>
                    )}
                    {run.status === 'failed' && (
                      <button onClick={() => runScenario(run.scenarioId)} className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">Retry</button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {state.runs.length === 0 && (
            <li className="px-4 py-8 text-center text-neutral-500">
              No runs found. Go to Scenarios to start a simulation.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
