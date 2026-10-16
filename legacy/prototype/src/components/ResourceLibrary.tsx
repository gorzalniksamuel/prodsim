import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, Trash2, Edit2, Save, X, Settings2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function ResourceLibrary() {
  const { state, addResource, updateResource, deleteResource, addResourceCategory } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string, capacity: number, cost: number, category: string, properties: Record<string, string>}>({ name: '', capacity: 1, cost: 0, category: 'Equipment', properties: {} });
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Custom properties state for the form
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');

  const handleEdit = (resource: any) => {
    setEditingId(resource.id);
    setEditForm({ 
      name: resource.name, 
      capacity: resource.capacity, 
      cost: resource.cost || 0,
      category: resource.category || 'Equipment',
      properties: resource.properties || {}
    });
  };

  const handleSave = () => {
    if (editingId) {
      updateResource(editingId, editForm);
      setEditingId(null);
    } else {
      addResource(editForm);
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteResource(itemToDelete);
      setItemToDelete(null);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !state.resourceCategories.includes(newCategory.trim())) {
      addResourceCategory(newCategory.trim());
      setEditForm({ ...editForm, category: newCategory.trim() });
    }
    setNewCategory('');
    setIsAddingCategory(false);
  };

  const handleAddProperty = () => {
    if (newPropKey.trim()) {
      setEditForm({
        ...editForm,
        properties: {
          ...editForm.properties,
          [newPropKey.trim()]: newPropValue.trim()
        }
      });
      setNewPropKey('');
      setNewPropValue('');
    }
  };

  const handleRemoveProperty = (key: string) => {
    const newProps = { ...editForm.properties };
    delete newProps[key];
    setEditForm({ ...editForm, properties: newProps });
  };

  const renderEditForm = () => (
    <div className="px-4 py-4 sm:px-6 bg-indigo-50">
      <div className="grid grid-cols-12 gap-4 items-start">
        <div className="col-span-12 sm:col-span-3 space-y-3">
          <input
            type="text"
            placeholder="Resource Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 w-16">Capacity:</span>
            <input
              type="number"
              placeholder="Capacity"
              value={editForm.capacity}
              onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 0 })}
              className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>

        <div className="col-span-12 sm:col-span-3 space-y-3">
          {isAddingCategory ? (
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="New Category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
              <button onClick={handleAddCategory} className="text-indigo-600"><Save className="w-4 h-4" /></button>
              <button onClick={() => setIsAddingCategory(false)} className="text-neutral-500"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex gap-1">
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              >
                {state.resourceCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button 
                onClick={() => setIsAddingCategory(true)}
                className="p-2 text-neutral-500 hover:text-indigo-600"
                title="Add new category"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 w-16">Cost:</span>
            <input
              type="number"
              placeholder="Cost/hr"
              value={editForm.cost}
              onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) || 0 })}
              className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>

        <div className="col-span-12 sm:col-span-4 bg-white p-3 rounded border border-neutral-200">
          <div className="text-xs font-medium text-neutral-700 mb-2 flex items-center">
            <Settings2 className="w-3 h-3 mr-1" /> Custom Properties
          </div>
          <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
            {Object.entries(editForm.properties).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs bg-neutral-50 p-1.5 rounded">
                <span className="font-medium text-neutral-700 truncate w-1/3">{key}</span>
                <span className="text-neutral-600 truncate w-1/2">{value}</span>
                <button onClick={() => handleRemoveProperty(key)} className="text-red-500 hover:text-red-700">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {Object.keys(editForm.properties).length === 0 && (
              <div className="text-xs text-neutral-400 italic">No custom properties</div>
            )}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="Key"
              value={newPropKey}
              onChange={(e) => setNewPropKey(e.target.value)}
              className="block w-1/3 rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs px-2 py-1 border"
            />
            <input
              type="text"
              placeholder="Value"
              value={newPropValue}
              onChange={(e) => setNewPropValue(e.target.value)}
              className="block w-1/2 rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs px-2 py-1 border"
            />
            <button 
              onClick={handleAddProperty}
              disabled={!newPropKey.trim()}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-2 flex justify-end gap-2 mt-2 sm:mt-0">
          <button onClick={handleSave} className="text-indigo-600 hover:text-indigo-900"><Save className="w-5 h-5" /></button>
          <button onClick={handleCancel} className="text-neutral-500 hover:text-neutral-700"><X className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Resource Library</h2>
          <p className="text-neutral-500 mt-1">Manage machines, workers, stations, and other capacities.</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditForm({ name: '', capacity: 1, cost: 0, category: state.resourceCategories[0] || 'Equipment', properties: {} });
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-neutral-200">
          {isAdding && (
            <li>
              {renderEditForm()}
            </li>
          )}
          {state.resources.map((resource) => (
            <li key={resource.id}>
              {editingId === resource.id ? (
                renderEditForm()
              ) : (
                <div className="px-4 py-4 flex items-center justify-between sm:px-6 hover:bg-neutral-50">
                  <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div className="font-medium text-neutral-900">{resource.name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                          {resource.category || 'Equipment'}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-neutral-500">
                      <div>Capacity: <span className="font-medium text-neutral-900">{resource.capacity}</span></div>
                      <div>Cost: <span className="font-medium text-neutral-900">${resource.cost || 0}/hr</span></div>
                    </div>
                    <div className="col-span-6">
                      {resource.properties && Object.keys(resource.properties).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(resource.properties).map(([k, v]) => (
                            <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">No custom properties</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 ml-4">
                    <button onClick={() => handleEdit(resource)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setItemToDelete(resource.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {state.resources.length === 0 && !isAdding && (
            <li className="px-4 py-8 text-center text-neutral-500">
              No resources found. Add one to get started.
            </li>
          )}
        </ul>
      </div>

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
