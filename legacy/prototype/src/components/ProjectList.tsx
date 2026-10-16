import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, Play, Edit2, Copy, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function ProjectList({ onSelectProject }: { onSelectProject: (id: string) => void }) {
  const { state, addProject, deleteProject } = useAppContext();
  const [newProjectName, setNewProjectName] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      addProject(newProjectName.trim());
      setNewProjectName('');
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteProject(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Projects</h2>
          <p className="text-neutral-500 mt-1">Manage your simulation flow models and projects.</p>
        </div>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="New project name..."
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

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-neutral-200">
          {state.projects.map((project) => (
            <li key={project.id}>
              <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-neutral-50 transition-colors">
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-indigo-600 truncate">{project.name}</h3>
                    <div className="mt-2 flex">
                      <div className="flex items-center text-sm text-neutral-500">
                        <span className="truncate">{project.nodes.length} nodes, {project.edges.length} edges</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-5 flex-shrink-0 flex gap-2">
                  <button
                    onClick={() => onSelectProject(project.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Edit2 className="w-4 h-4 mr-2 text-neutral-400" />
                    Edit Flow
                  </button>
                  <button
                    className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Copy className="w-4 h-4 text-neutral-400" />
                  </button>
                  <button
                    onClick={() => setItemToDelete(project.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {state.projects.length === 0 && (
            <li className="px-4 py-8 text-center text-neutral-500">
              No projects found. Create one to get started.
            </li>
          )}
        </ul>
      </div>

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
