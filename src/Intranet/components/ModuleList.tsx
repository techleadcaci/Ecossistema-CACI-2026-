import React, { useState, useEffect } from 'react';
import { 
  collection, query, onSnapshot, addDoc, 
  updateDoc, deleteDoc, doc, serverTimestamp, 
  orderBy, limit 
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { logAction } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { 
  Plus, Search, Filter, MoreVertical, 
  Edit2, Trash2, Eye, Download, 
  ChevronLeft, ChevronRight, X, 
  CheckCircle2, AlertCircle, Info, ArrowUpDown,
  Printer, FileUp, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatBRDateTime } from '../../services/maintenanceService';

interface ModuleListProps {
  collectionName: string;
  title: string;
  description: string;
  columns: {
    key: string;
    label: string;
    render?: (val: any, row: any) => React.ReactNode;
    sortable?: boolean;
  }[];
  formFields: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'email' | 'url' | 'time' | 'datetime-local';
    options?: { label: string; value: any }[];
    required?: boolean;
  }[];
  extraHeaderAction?: React.ReactNode;
  hierarchyRole?: 'executive' | 'subordinate';
  executiveModule?: string;
}

const ModuleList = ({ 
  collectionName, 
  title, 
  description, 
  columns, 
  formFields, 
  extraHeaderAction,
  hierarchyRole,
  executiveModule
}: ModuleListProps) => {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [attachment, setAttachment] = useState<{ name: string; data: string; type: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [collectionName]);

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
    setAttachment(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          name: file.name,
          type: file.type,
          data: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      window.print();
    } catch (error) {
      console.error('Erro ao imprimir:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const data = {
        ...formData,
        attachment: attachment,
        id_ccgu: profile?.id_ccgu || 'pendente_configuracao',
        id_cfrh: profile?.id_cfrh || 'pendente_configuracao',
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid,
      };

      if (hierarchyRole === 'subordinate') {
        // Enviar para validação em vez de salvar diretamente
        await addDoc(collection(db, 'validation_requests'), {
          type: editingItem ? 'module_update' : 'module_create',
          action: `${editingItem ? 'Atualização' : 'Criação'} em ${title}: ${formData.name || formData.title || 'Novo Item'}`,
          data: data,
          before: editingItem || null,
          targetId: editingItem?.id || null,
          collection: collectionName,
          module: title,
          requested_by: auth.currentUser?.uid,
          requested_by_name: profile?.name || auth.currentUser?.email,
          status: 'pendente',
          timestamp: serverTimestamp()
        });
        alert('Solicitação enviada para validação da Diretoria.');
        handleCloseModal();
        return;
      }

      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), data);
        await logAction(`Atualização em ${title}`, {
          collection: collectionName,
          doc_id: editingItem.id,
          id_ccgu: profile?.id_ccgu,
          id_cfrh: profile?.id_cfrh,
          details: `Item ID: ${editingItem.id} atualizado.`
        });
      } else {
        const docRef = await addDoc(collection(db, collectionName), {
          ...data,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid,
          created_at: serverTimestamp(),
          created_by: auth.currentUser?.uid,
        });
        await logAction(`Criação em ${title}`, {
          collection: collectionName,
          doc_id: docRef.id,
          id_ccgu: profile?.id_ccgu,
          id_cfrh: profile?.id_cfrh,
          details: `Novo item criado com ID: ${docRef.id}.`
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar dados. Verifique as permissões.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        if (hierarchyRole === 'subordinate') {
          const itemToDelete = items.find(i => i.id === id);
          await addDoc(collection(db, 'validation_requests'), {
            type: 'module_delete',
            action: `Exclusão em ${title}: ${itemToDelete?.name || itemToDelete?.title || id}`,
            targetId: id,
            collection: collectionName,
            module: title,
            requested_by: auth.currentUser?.uid,
            requested_by_name: profile?.name || auth.currentUser?.email,
            status: 'pendente',
            timestamp: serverTimestamp()
          });
          alert('Solicitação de exclusão enviada para validação da Diretoria.');
          return;
        }

        await deleteDoc(doc(db, collectionName, id));
        await logAction(`Exclusão em ${title}`, {
          collection: collectionName,
          doc_id: id,
          details: `Item ID: ${id} excluído.`
        });
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir item.');
      }
    }
  };

  const filteredItems = items.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {extraHeaderAction}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-2xl font-bold shadow-lg shadow-brand-blue/20 hover:scale-[1.02] active:scale-100 transition-all"
          >
            <Plus size={20} />
            Novo Registro
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-slate-600 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-100">
              <Filter size={20} />
            </button>
            <button className="p-2.5 text-slate-600 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-100">
              <Download size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                {columns.map((col) => (
                  <th 
                    key={col.key} 
                    onClick={() => col.sortable && requestSort(col.key)}
                    className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 ${col.sortable ? 'cursor-pointer hover:text-brand-blue' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.sortable && <ArrowUpDown size={12} />}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto"></div>
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 text-sm text-slate-700 font-medium">
                        {col.render ? col.render(item[col.key], item) : (
                          item[col.key]?.toDate ? formatBRDateTime(item[col.key]) : String(item[col.key] ?? '')
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <header className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{editingItem ? 'Editar Registro' : 'Novo Registro'}</h3>
                  <p className="text-sm text-slate-500">{title}</p>
                </div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCloseModal();
                  }}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </header>
              
              <form 
                id="module-form" 
                onSubmit={handleSubmit} 
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col h-full overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {formFields.map((field) => (
                      <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            required={field.required}
                            value={formData[field.key] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all min-h-[120px]"
                          />
                        ) : field.type === 'select' ? (
                          <select
                            required={field.required}
                            value={formData[field.key] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                          >
                            <option value="">Selecione...</option>
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            required={field.required}
                            value={formData[field.key] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Document Upload Section */}
                  <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl space-y-4">
                    <label className="block text-sm font-bold text-slate-700">
                      Inserir Documento (Word/PDF/Imagem)
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-brand-blue hover:bg-brand-blue/5 transition-all group">
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleFileChange}
                          accept=".doc,.docx,.pdf,image/*"
                        />
                        <FileUp className="text-slate-400 group-hover:text-brand-blue" size={24} />
                        <span className="text-sm font-medium text-slate-500 group-hover:text-brand-blue">
                          {attachment ? attachment.name : 'Clique para selecionar ou arraste o arquivo'}
                        </span>
                      </label>
                      {attachment && (
                        <button 
                          type="button"
                          onClick={() => setAttachment(null)}
                          className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-8 border-t border-slate-100 bg-white shrink-0">
                  <button 
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200"
                  >
                    <Printer size={18} />
                    IMPRIMIR (protocolo)
                  </button>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCloseModal();
                      }}
                      className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      onClick={(e) => {
                        // Ensure submission even if type="submit" is flaky in this layout
                        if (e.currentTarget.type !== 'submit') {
                          handleSubmit(e);
                        }
                      }}
                      className="px-8 py-3 bg-brand-blue text-white rounded-2xl font-bold shadow-lg shadow-brand-blue/20 hover:scale-[1.02] active:scale-100 transition-all"
                    >
                      Salvar Registro
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModuleList;
