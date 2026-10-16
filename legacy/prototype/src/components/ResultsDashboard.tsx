import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ResultsDashboard() {
  const { state } = useAppContext();

  const completedRuns = state.runs.filter(r => r.status === 'completed' && r.results);

  const chartData = completedRuns.map(run => {
    const scenario = state.scenarios.find(s => s.id === run.scenarioId);
    return {
      name: scenario?.name || 'Unknown',
      throughput: run.results!.throughput,
      cycleTime: run.results!.cycleTime,
      utilization: run.results!.utilization * 100,
      queueLength: run.results!.queueLength,
    };
  });

  if (completedRuns.length === 0) {
    return (
      <div className="p-8 max-w-5xl mx-auto w-full text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Results Dashboard</h2>
        <p className="text-neutral-500">No completed runs available. Run a scenario to see results.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Results Dashboard</h2>
        <p className="text-neutral-500 mt-1">Compare KPIs across different scenarios.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Throughput Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="throughput" fill="#4f46e5" name="Throughput (units)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Cycle Time Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cycleTime" fill="#10b981" name="Cycle Time (mins)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Resource Utilization</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="utilization" fill="#f59e0b" name="Utilization (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Average Queue Length</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="queueLength" fill="#ef4444" name="Queue Length" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
