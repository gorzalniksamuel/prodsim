import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, Trash2, Edit2, Save, X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import ConfirmModal from './ConfirmModal';

export default function EntityLibrary() {
  const { state, addEntity, addEntities, updateEntity, deleteEntity, addEntityGroup } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', group: '', variants: '' });
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState('');

  const handleEdit = (entity: any) => {
    setEditingId(entity.id);
    setEditForm({ name: entity.name, group: entity.group || state.entityGroups[0] || '', variants: entity.variants.join(', ') });
  };

  const handleSave = () => {
    const variants = editForm.variants.split(',').map(v => v.trim()).filter(v => v);
    if (editingId) {
      updateEntity(editingId, { name: editForm.name, group: editForm.group, variants });
      setEditingId(null);
    } else {
      addEntity({ name: editForm.name, group: editForm.group, variants });
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteEntity(itemToDelete);
      setItemToDelete(null);
    }
  };

  const handleAddGroup = () => {
    if (newGroup.trim() && !state.entityGroups.includes(newGroup.trim())) {
      addEntityGroup(newGroup.trim());
      setEditForm({ ...editForm, group: newGroup.trim() });
    }
    setNewGroup('');
    setIsAddingGroup(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newEntities = data.map((row: any) => {
          const group = row.Group || row.group || 'Default';
          if (group && !state.entityGroups.includes(group)) {
            addEntityGroup(group);
          }
          return {
            name: row.Name || row.name || 'Unnamed Entity',
            group: group,
            variants: (row.Variants || row.variants || '').toString().split(',').map((v: string) => v.trim()).filter((v: string) => v)
          };
        });
        
        if (newEntities.length > 0) {
          addEntities(newEntities);
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Failed to parse file. Please ensure it has Name, Group, and Variants columns.");
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Group entities
  const groupedEntities = state.entities.reduce((acc, entity) => {
    const group = entity.group || 'Ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(entity);
    return acc;
  }, {} as Record<string, typeof state.entities>);

  const renderGroupSelector = () => {
    if (isAddingGroup) {
      return (
        <div className="flex gap-1 col-span-3">
          <input
            type="text"
            placeholder="New Group"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
          />
          <button onClick={handleAddGroup} className="text-indigo-600"><Save className="w-4 h-4" /></button>
          <button onClick={() => setIsAddingGroup(false)} className="text-neutral-500"><X className="w-4 h-4" /></button>
        </div>
      );
    }
    return (
      <div className="flex gap-1 col-span-3">
        <select
          value={editForm.group}
          onChange={(e) => setEditForm({ ...editForm, group: e.target.value })}
          className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
        >
          <option value="">Select Group...</option>
          {state.entityGroups.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <button 
          onClick={() => setIsAddingGroup(true)}
          className="p-2 text-neutral-500 hover:text-indigo-600"
          title="Add new group"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Entity & Variant Library</h2>
          <p className="text-neutral-500 mt-1">Manage products, orders, patients, jobs, and their variants.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md shadow-sm text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV/XLSX
          </button>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditForm({ name: '', group: state.entityGroups[0] || '', variants: '' });
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entity
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-neutral-200">
          {isAdding && (
            <li className="px-4 py-4 sm:px-6 bg-indigo-50">
              <div className="grid grid-cols-12 gap-4 items-center">
                <input
                  type="text"
                  placeholder="Entity Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="col-span-3 block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
                {renderGroupSelector()}
                <input
                  type="text"
                  placeholder="Variants (comma separated)"
                  value={editForm.variants}
                  onChange={(e) => setEditForm({ ...editForm, variants: e.target.value })}
                  className="col-span-4 block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
                <div className="col-span-2 flex justify-end gap-2">
                  <button onClick={handleSave} className="text-indigo-600 hover:text-indigo-900"><Save className="w-5 h-5" /></button>
                  <button onClick={handleCancel} className="text-neutral-500 hover:text-neutral-700"><X className="w-5 h-5" /></button>
                </div>
              </div>
            </li>
          )}
          
          {Object.entries(groupedEntities).map(([group, entities]) => (
            <React.Fragment key={group}>
              <li className="bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700 border-y border-neutral-200">
                {group}
              </li>
              {entities.map((entity) => (
                <li key={entity.id}>
                  {editingId === entity.id ? (
                    <div className="px-4 py-4 sm:px-6 bg-indigo-50">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="col-span-3 block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                        {renderGroupSelector()}
                        <input
                          type="text"
                          value={editForm.variants}
                          onChange={(e) => setEditForm({ ...editForm, variants: e.target.value })}
                          className="col-span-4 block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                        <div className="col-span-2 flex justify-end gap-2">
                          <button onClick={handleSave} className="text-indigo-600 hover:text-indigo-900"><Save className="w-5 h-5" /></button>
                          <button onClick={handleCancel} className="text-neutral-500 hover:text-neutral-700"><X className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-4 flex items-center justify-between sm:px-6 hover:bg-neutral-50">
                      <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3 font-medium text-neutral-900">{entity.name}</div>
                        <div className="col-span-3 text-sm text-neutral-500">{entity.group || 'Ungrouped'}</div>
                        <div className="col-span-6 text-neutral-500">
                          {entity.variants.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {entity.variants.map((v, i) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                                  {v}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm italic">No variants</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 ml-4">
                        <button onClick={() => handleEdit(entity)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setItemToDelete(entity.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </React.Fragment>
          ))}
          {state.entities.length === 0 && !isAdding && (
            <li className="px-4 py-8 text-center text-neutral-500">
              No entities found. Add one or import from CSV/XLSX.
            </li>
          )}
        </ul>
      </div>

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Entity"
        message="Are you sure you want to delete this entity? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
