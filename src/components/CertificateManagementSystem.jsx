import React, { useState, useEffect } from 'react';
import { Search, Printer, Plus, Check, X, FileText, Calendar, User, CheckSquare, Square, ChevronDown, Upload, Download, Edit, Trash2, RotateCcw, Plane } from 'lucide-react';
import { supabase } from '../supabaseClient'; // استيراد Supabase

const CertificateManagementSystem = () => {
  const [certificates, setCertificates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedForPrint, setSelectedForPrint] = useState([]);
  const [selectedForDelivery, setSelectedForDelivery] = useState([]);
  const [printMode, setPrintMode] = useState('');
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchField, setSearchField] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    no: '',
    description: '',
    partNo: '',
    serialNo: '',
    status: 'New'
  });

  const [deliveryData, setDeliveryData] = useState({
    receiverName: '',
    receiverPosition: '',
    receiverSignature: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadCertificates();
    
    const afterPrint = () => {
      setPrintMode('');
    };
    
    window.addEventListener('afterprint', afterPrint);
    
    return () => {
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  // تحميل الشهادات من Supabase
  const loadCertificates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // تحويل البيانات من قاعدة البيانات إلى الصيغة المستخدمة في التطبيق
      const formattedData = data.map(cert => ({
        id: cert.id,
        no: cert.no,
        description: cert.description,
        partNo: cert.part_no || '',
        serialNo: cert.serial_no || '',
        status: cert.status,
        createdDate: cert.created_date || cert.created_at.split('T')[0],
        delivered: cert.delivered,
        deliveryInfo: cert.delivery_info
      }));

      setCertificates(formattedData);
    } catch (error) {
      console.error('Error loading certificates:', error);
      alert('Error loading data from database');
    } finally {
      setLoading(false);
    }
  };

  // إضافة أو تعديل شهادة
  const handleAddCertificate = async () => {
    if (!formData.no || !formData.description) {
      alert('Please enter at least Number and Description');
      return;
    }

    try {
      setLoading(true);

      if (editMode && selectedCert) {
        // تعديل شهادة موجودة
        const { error } = await supabase
          .from('certificates')
          .update({
            no: formData.no,
            description: formData.description,
            part_no: formData.partNo,
            serial_no: formData.serialNo,
            status: formData.status
          })
          .eq('id', selectedCert.id);

        if (error) throw error;
        alert('Certificate updated successfully');
      } else {
        // إضافة شهادة جديدة
        const { error } = await supabase
          .from('certificates')
          .insert([{
            no: formData.no,
            description: formData.description,
            part_no: formData.partNo,
            serial_no: formData.serialNo,
            status: formData.status,
            created_date: new Date().toISOString().split('T')[0],
            delivered: false,
            delivery_info: null
          }]);

        if (error) throw error;
        alert('Certificate added successfully');
      }

      // إعادة تحميل البيانات
      await loadCertificates();
      
      setFormData({
        no: '',
        description: '',
        partNo: '',
        serialNo: '',
        status: 'New'
      });
      setShowForm(false);
      setEditMode(false);
      setSelectedCert(null);
    } catch (error) {
      console.error('Error saving certificate:', error);
      alert('Error saving certificate: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCertificate = (cert) => {
    setSelectedCert(cert);
    setFormData({
      no: cert.no,
      description: cert.description,
      partNo: cert.partNo,
      serialNo: cert.serialNo,
      status: cert.status
    });
    setEditMode(true);
    setShowForm(true);
  };

  // حذف شهادة
  const handleDeleteCertificate = async (cert) => {
    if (window.confirm(`Are you sure you want to delete Certificate No: ${cert.no}?`)) {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('certificates')
          .delete()
          .eq('id', cert.id);

        if (error) throw error;

        await loadCertificates();
        setSelectedForPrint(prev => prev.filter(c => c.id !== cert.id));
        setSelectedForDelivery(prev => prev.filter(c => c.id !== cert.id));
        alert('Certificate deleted successfully!');
      } catch (error) {
        console.error('Error deleting certificate:', error);
        alert('Error deleting certificate');
      } finally {
        setLoading(false);
      }
    }
  };

  // إلغاء التسليم
  const handleUndoDelivery = async (cert) => {
    if (window.confirm(`Undo delivery for Certificate No: ${cert.no}?`)) {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('certificates')
          .update({
            delivered: false,
            delivery_info: null
          })
          .eq('id', cert.id);

        if (error) throw error;

        await loadCertificates();
        alert('Delivery undone successfully!');
      } catch (error) {
        console.error('Error undoing delivery:', error);
        alert('Error undoing delivery');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelivery = (cert) => {
    setSelectedCert(cert);
    setDeliveryData({
      receiverName: '',
      receiverPosition: '',
      receiverSignature: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowDeliveryForm(true);
  };

  // تأكيد التسليم
  const confirmDelivery = async () => {
    if (!deliveryData.receiverName) {
      alert('Please enter receiver name');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('certificates')
        .update({
          delivered: true,
          delivery_info: deliveryData
        })
        .eq('id', selectedCert.id);

      if (error) throw error;

      await loadCertificates();
      setShowDeliveryForm(false);
      setSelectedCert(null);
      alert('Certificate delivered successfully!');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert('Error confirming delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelivery = () => {
    const undeliveredSelected = selectedForDelivery.filter(cert => !cert.delivered);
    if (undeliveredSelected.length === 0) {
      alert('Please select undelivered certificates');
      return;
    }
    setSelectedCert({ no: `${undeliveredSelected.length} certificates` });
    setShowDeliveryForm(true);
  };

  // تأكيد التسليم الجماعي
  const confirmBulkDelivery = async () => {
    if (!deliveryData.receiverName) {
      alert('Please enter receiver name');
      return;
    }

    try {
      setLoading(true);
      const undelivered = selectedForDelivery.filter(c => !c.delivered);
      const ids = undelivered.map(c => c.id);

      const { error } = await supabase
        .from('certificates')
        .update({
          delivered: true,
          delivery_info: deliveryData
        })
        .in('id', ids);

      if (error) throw error;

      await loadCertificates();
      setShowDeliveryForm(false);
      setSelectedCert(null);
      setSelectedForDelivery([]);
      alert(`Successfully delivered ${undelivered.length} certificate(s)!`);
    } catch (error) {
      console.error('Error confirming bulk delivery:', error);
      alert('Error confirming bulk delivery');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectForDelivery = (certId) => {
    setSelectedForDelivery(prev => {
      const cert = certificates.find(c => c.id === certId);
      if (prev.find(c => c.id === certId)) {
        return prev.filter(c => c.id !== certId);
      } else {
        return [...prev, cert];
      }
    });
  };

  const selectAllForDelivery = () => {
    const undelivered = filteredCertificates.filter(c => !c.delivered);
    if (selectedForDelivery.length === undelivered.length) {
      setSelectedForDelivery([]);
    } else {
      setSelectedForDelivery([...undelivered]);
    }
  };

  const handlePrintSingle = (cert) => {
    setSelectedForPrint([cert]);
    setPrintMode('single');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handlePrintSeparate = () => {
    if (selectedForPrint.length === 0) {
      alert('Please select certificates to print');
      return;
    }
    setPrintMode('separate');
    setShowPrintMenu(false);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handlePrintCombined = () => {
    if (selectedForPrint.length === 0) {
      alert('Please select certificates to print');
      return;
    }
    setPrintMode('combined');
    setShowPrintMenu(false);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const toggleSelectForPrint = (certId) => {
    setSelectedForPrint(prev => {
      const cert = certificates.find(c => c.id === certId);
      if (prev.find(c => c.id === certId)) {
        return prev.filter(c => c.id !== certId);
      } else {
        return [...prev, cert];
      }
    });
  };

  const selectAllForPrint = () => {
    const filtered = filteredCertificates;
    if (selectedForPrint.length === filtered.length) {
      setSelectedForPrint([]);
    } else {
      setSelectedForPrint([...filtered]);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = selectedForPrint.length > 0 ? selectedForPrint : certificates;
    
    if (dataToExport.length === 0) {
      alert('No certificates to export');
      return;
    }

    try {
      const headers = ['Certificate No.', 'Description', 'Part No.', 'Serial No.', 'Status', 'Created Date', 'Delivered', 'Receiver Name', 'Receiver Position', 'Delivery Date', 'Signature', 'Notes'];
      
      const csvData = dataToExport.map(cert => [
        cert.no,
        cert.description,
        cert.partNo || '',
        cert.serialNo || '',
        cert.status,
        cert.createdDate,
        cert.delivered ? 'Yes' : 'No',
        cert.deliveryInfo?.receiverName || '',
        cert.deliveryInfo?.receiverPosition || '',
        cert.deliveryInfo?.deliveryDate || '',
        cert.deliveryInfo?.receiverSignature || '',
        cert.deliveryInfo?.notes || ''
      ]);

      let csv = headers.join(',') + '\n';
      csvData.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Certificates_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Exported ${dataToExport.length} certificate(s) successfully!`);
    } catch (error) {
      alert('Error exporting data. Please try again.');
      console.error(error);
    }
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const text = e.target.result;
        const lines = text.split('\n');
        
        if (lines.length < 2) {
          alert('File is empty or invalid');
          return;
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        const noIndex = headers.findIndex(h => h.toLowerCase().includes('certificate') || h.toLowerCase().includes('no'));
        const descIndex = headers.findIndex(h => h.toLowerCase().includes('description'));
        
        if (noIndex === -1 || descIndex === -1) {
          alert('File must have "Certificate No." and "Description" columns');
          return;
        }

        const partIndex = headers.findIndex(h => h.toLowerCase().includes('part'));
        const serialIndex = headers.findIndex(h => h.toLowerCase().includes('serial'));
        const statusIndex = headers.findIndex(h => h.toLowerCase().includes('status'));

        const importedCerts = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const cells = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
          
          if (cells[noIndex] && cells[descIndex]) {
            importedCerts.push({
              no: cells[noIndex],
              description: cells[descIndex],
              part_no: partIndex !== -1 ? cells[partIndex] : '',
              serial_no: serialIndex !== -1 ? cells[serialIndex] : '',
              status: statusIndex !== -1 && cells[statusIndex] ? cells[statusIndex] : 'New',
              created_date: new Date().toISOString().split('T')[0],
              delivered: false,
              delivery_info: null
            });
          }
        }

        if (importedCerts.length === 0) {
          alert('No valid certificates found in the file');
          return;
        }

        // إدراج البيانات في Supabase
        const { error } = await supabase
          .from('certificates')
          .insert(importedCerts);

        if (error) throw error;

        await loadCertificates();
        setShowImportModal(false);
        alert(`Successfully imported ${importedCerts.length} certificate(s)!`);
        
        event.target.value = '';
      } catch (error) {
        alert('Error importing data: ' + error.message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = ['Certificate No.', 'Description', 'Part No.', 'Serial No.', 'Status'];
    const sampleData = [
      ['CERT-001', 'Sample Certificate Description', 'PART-123', 'SN-456789', 'New'],
      ['CERT-002', 'Another Sample Certificate', 'PART-124', 'SN-456790', 'Active']
    ];

    let csv = headers.join(',') + '\n';
    sampleData.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Certificate_Import_Template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCertificates = certificates.filter(cert => {
    const searchLower = searchTerm.toLowerCase();
    
    let matchesSearch = false;
    if (searchField === 'all') {
      matchesSearch = 
        cert.no.toLowerCase().includes(searchLower) ||
        cert.description.toLowerCase().includes(searchLower) ||
        cert.partNo.toLowerCase().includes(searchLower) ||
        cert.serialNo.toLowerCase().includes(searchLower);
    } else if (searchField === 'no') {
      matchesSearch = cert.no.toLowerCase().includes(searchLower);
    } else if (searchField === 'description') {
      matchesSearch = cert.description.toLowerCase().includes(searchLower);
    } else if (searchField === 'partNo') {
      matchesSearch = cert.partNo.toLowerCase().includes(searchLower);
    } else if (searchField === 'serialNo') {
      matchesSearch = cert.serialNo.toLowerCase().includes(searchLower);
    }

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'delivered' && cert.delivered) ||
      (filterStatus === 'pending' && !cert.delivered);

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCertificates = filteredCertificates.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, searchField]);

  const stats = {
    total: certificates.length,
    delivered: certificates.filter(c => c.delivered).length,
    pending: certificates.filter(c => !c.delivered).length
  };

  const Logo = () => (
    <div className="flex items-center gap-2">
      <div className="bg-blue-600 p-2 rounded-lg">
        <Plane className="text-white" size={24} />
      </div>
      <div className="hidden sm:block">
        <div className="text-xl font-bold text-gray-800">Smart Aviation</div>
        <div className="text-xs text-gray-500">Certificate Management</div>
      </div>
    </div>
  );

  // مؤشر التحميل
  if (loading && certificates.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* مؤشر التحميل العائم */}
      {loading && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span className="text-sm font-medium">Processing...</span>
        </div>
      )}

      <style>{`
        @media print {
          * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .page-break {
            page-break-after: always;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }
        
        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>

      <div id="print-area" style={{ display: printMode ? 'block' : 'none' }}>
        {printMode === 'single' && selectedForPrint[0] && (
          <SingleCertificatePrint cert={selectedForPrint[0]} />
        )}

        {printMode === 'separate' && selectedForPrint.map((cert, index) => (
          <div key={cert.id} className={index < selectedForPrint.length - 1 ? 'page-break' : ''}>
            <SingleCertificatePrint cert={cert} index={index} total={selectedForPrint.length} />
          </div>
        ))}

        {printMode === 'combined' && (
          <CombinedCertificatesPrint certificates={selectedForPrint} />
        )}
      </div>

      <div className="print:hidden">
        <div className="container mx-auto px-3 py-3 max-w-7xl">
          {/* Header with Logo and Actions */}
          <div className="bg-white rounded-lg shadow-md p-3 mb-3">
            <div className="flex items-center justify-between">
              <Logo />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  disabled={loading}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-green-700 transition-all shadow-sm hover:shadow text-xs font-medium disabled:opacity-50"
                >
                  <Upload size={14} />
                  Import
                </button>
                <button
                  onClick={handleExportExcel}
                  className="bg-purple-600 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-purple-700 transition-all shadow-sm hover:shadow text-xs font-medium"
                >
                  <Download size={14} />
                  Export
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setSelectedCert(null);
                    setFormData({
                      no: '',
                      description: '',
                      partNo: '',
                      serialNo: '',
                      status: 'New'
                    });
                    setShowForm(true);
                  }}
                  disabled={loading}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-blue-700 transition-all shadow-sm hover:shadow text-xs font-medium disabled:opacity-50"
                >
                  <Plus size={14} />
                  Add New
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90 font-medium">Total Certificates</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <FileText size={32} className="opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90 font-medium">Delivered</p>
                  <p className="text-2xl font-bold mt-1">{stats.delivered}</p>
                </div>
                <Check size={32} className="opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90 font-medium">Pending</p>
                  <p className="text-2xl font-bold mt-1">{stats.pending}</p>
                </div>
                <X size={32} className="opacity-80" />
              </div>
            </div>
          </div>
          
          {/* Selection Info */}
          {(selectedForPrint.length > 0 || selectedForDelivery.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {selectedForPrint.length > 0 && (
                <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r-lg p-2 shadow-sm">
                  <p className="text-xs text-purple-800 font-medium">
                    <Printer size={12} className="inline mr-1" />
                    <strong>{selectedForPrint.length}</strong> certificate(s) selected for print
                  </p>
                </div>
              )}
              
              {selectedForDelivery.length > 0 && (
                <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-2 shadow-sm flex items-center justify-between">
                  <p className="text-xs text-green-800 font-medium">
                    <Check size={12} className="inline mr-1" />
                    <strong>{selectedForDelivery.filter(c => !c.delivered).length}</strong> certificate(s) selected
                  </p>
                  <button
                    onClick={handleBulkDelivery}
                    disabled={selectedForDelivery.filter(c => !c.delivered).length === 0 || loading}
                    className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:bg-gray-300 text-xs font-medium flex items-center gap-1"
                  >
                    <Check size={12} />
                    Deliver All
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-md p-3 mb-3">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-12 sm:col-span-2">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Fields</option>
                  <option value="no">Certificate No.</option>
                  <option value="description">Description</option>
                  <option value="partNo">Part No.</option>
                  <option value="serialNo">Serial No.</option>
                </select>
              </div>

              <div className="col-span-12 sm:col-span-4 relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={`Search in ${searchField === 'all' ? 'all fields' : searchField}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-6 sm:col-span-1">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Items per page"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={9999}>All</option>
                </select>
              </div>

              <div className="col-span-6 sm:col-span-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div className="col-span-6 sm:col-span-1">
                <button
                  onClick={selectAllForPrint}
                  className="w-full px-2 py-2 border-2 border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 text-xs font-medium transition-colors"
                  title="Select All for Print"
                >
                  <Printer size={12} className="inline" />
                </button>
              </div>

              <div className="col-span-6 sm:col-span-1">
                <button
                  onClick={selectAllForDelivery}
                  className="w-full px-2 py-2 border-2 border-green-500 text-green-600 rounded-md hover:bg-green-50 text-xs font-medium transition-colors"
                  title="Select All for Delivery"
                >
                  <Check size={12} className="inline" />
                </button>
              </div>

              <div className="col-span-12 sm:col-span-1 relative">
                <button
                  onClick={() => setShowPrintMenu(!showPrintMenu)}
                  disabled={selectedForPrint.length === 0}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                  title={`Print ${selectedForPrint.length} certificate(s)`}
                >
                  <Printer size={14} />
                  <span>{selectedForPrint.length}</span>
                </button>
                {showPrintMenu && selectedForPrint.length > 0 && (
                  <div className="absolute top-full mt-1 right-0 w-48 bg-white border border-gray-200 rounded-md shadow-xl z-50">
                    <button
                      onClick={handlePrintSeparate}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b text-sm flex items-center gap-2"
                    >
                      <FileText size={14} className="text-blue-600" />
                      <div>
                        <div className="font-medium">Separate Pages</div>
                        <div className="text-xs text-gray-500">Each certificate on own page</div>
                      </div>
                    </button>
                    <button
                      onClick={handlePrintCombined}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2"
                    >
                      <FileText size={14} className="text-green-600" />
                      <div>
                        <div className="font-medium">Combined Receipt</div>
                        <div className="text-xs text-gray-500">All in one document</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="w-10 px-2 py-3 text-left">
                      <button onClick={selectAllForPrint} title="Select for Print" className="hover:bg-blue-50 p-1 rounded">
                        {selectedForPrint.length === filteredCertificates.length && filteredCertificates.length > 0 ? 
                          <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />
                        }
                      </button>
                    </th>
                    <th className="w-10 px-2 py-3 text-left">
                      <button onClick={selectAllForDelivery} title="Select for Delivery" className="hover:bg-green-50 p-1 rounded">
                        {selectedForDelivery.length === filteredCertificates.filter(c => !c.delivered).length && filteredCertificates.filter(c => !c.delivered).length > 0 ? 
                          <CheckSquare size={16} className="text-green-600" /> : <Square size={16} />
                        }
                      </button>
                    </th>
                    <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">No.</th>
                    <th className="w-48 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Description</th>
                    <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Part No.</th>
                    <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden xl:table-cell">Serial No.</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCertificates.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500 text-sm">
                        <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No certificates found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedCertificates.map(cert => (
                      <tr key={cert.id} className="hover:bg-blue-50 transition-colors group">
                        <td className="w-10 px-2 py-3">
                          <button onClick={() => toggleSelectForPrint(cert.id)} className="hover:bg-blue-100 p-1 rounded">
                            {selectedForPrint.find(c => c.id === cert.id) ? 
                              <CheckSquare size={16} className="text-blue-600" /> : 
                              <Square size={16} className="text-gray-400 group-hover:text-gray-600" />
                            }
                          </button>
                        </td>
                        <td className="w-10 px-2 py-3">
                          <button 
                            onClick={() => toggleSelectForDelivery(cert.id)} 
                            disabled={cert.delivered}
                            className={cert.delivered ? 'cursor-not-allowed' : 'hover:bg-green-100 p-1 rounded'}
                          >
                            {cert.delivered ? (
                              <CheckSquare size={16} className="text-gray-300" />
                            ) : selectedForDelivery.find(c => c.id === cert.id) ? 
                              <CheckSquare size={16} className="text-green-600" /> : 
                              <Square size={16} className="text-gray-400 group-hover:text-gray-600" />
                            }
                          </button>
                        </td>
                        <td className="w-28 px-3 py-3 text-xs font-medium text-gray-900">
                          <div className="truncate" title={cert.no}>{cert.no}</div>
                        </td>
                        <td className="w-48 px-3 py-3 text-xs text-gray-700 hidden md:table-cell">
                          <div className="line-clamp-2" title={cert.description}>
                            {cert.description}
                          </div>
                        </td>
                        <td className="w-28 px-3 py-3 text-xs text-gray-700 hidden lg:table-cell">
                          <div className="truncate" title={cert.partNo || '-'}>{cert.partNo || '-'}</div>
                        </td>
                        <td className="w-28 px-3 py-3 text-xs text-gray-700 hidden xl:table-cell">
                          <div className="truncate" title={cert.serialNo || '-'}>{cert.serialNo || '-'}</div>
                        </td>
                        <td className="w-24 px-3 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate max-w-full" title={cert.status}>
                            {cert.status}
                          </span>
                        </td>
                        <td className="w-32 px-3 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => handleEditCertificate(cert)}
                              disabled={loading}
                              className="bg-yellow-500 text-white p-1.5 rounded hover:bg-yellow-600 transition-colors shadow-sm hover:shadow disabled:opacity-50"
                              title="Edit Certificate"
                            >
                              <Edit size={12} />
                            </button>
                            {!cert.delivered ? (
                              <button
                                onClick={() => handleDelivery(cert)}
                                disabled={loading}
                                className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 transition-colors shadow-sm hover:shadow disabled:opacity-50"
                                title="Mark as Delivered"
                              >
                                <Check size={12} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUndoDelivery(cert)}
                                disabled={loading}
                                className="bg-orange-500 text-white p-1.5 rounded hover:bg-orange-600 transition-colors shadow-sm hover:shadow disabled:opacity-50"
                                title="Undo Delivery"
                              >
                                <RotateCcw size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => handlePrintSingle(cert)}
                              className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
                              title="Print Certificate"
                            >
                              <Printer size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCertificate(cert);
                              }}
                              disabled={loading}
                              className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700 transition-colors shadow-sm hover:shadow disabled:opacity-50"
                              title="Delete Certificate"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredCertificates.length > 0 && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-xs text-gray-600">
                    Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(endIndex, filteredCertificates.length)}</strong> of <strong>{filteredCertificates.length}</strong> results
                    {filteredCertificates.length !== certificates.length && (
                      <span className="text-gray-400"> (filtered from {certificates.length})</span>
                    )}
                  </p>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="First Page"
                    >
                      ««
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous Page"
                    >
                      «
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next Page"
                    >
                      »
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Last Page"
                    >
                      »»
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form Modals - باقي الكود كما هو */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">
                {editMode ? 'Edit Certificate' : 'Add New Certificate'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Certificate No. *</label>
                  <input
                    type="text"
                    value={formData.no}
                    onChange={(e) => setFormData({...formData, no: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Status</label>
                  <input
                    type="text"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium mb-2">Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Part No.</label>
                  <input
                    type="text"
                    value={formData.partNo}
                    onChange={(e) => setFormData({...formData, partNo: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Serial No.</label>
                  <input
                    type="text"
                    value={formData.serialNo}
                    onChange={(e) => setFormData({...formData, serialNo: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditMode(false);
                    setSelectedCert(null);
                  }}
                  className="px-4 sm:px-6 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCertificate}
                  disabled={loading}
                  className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  {editMode ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeliveryForm && selectedCert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                {selectedForDelivery.length > 0 && selectedCert.no.includes('certificates') 
                  ? 'Bulk Certificate Delivery' 
                  : 'Certificate Delivery'}
              </h2>
              <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                {selectedForDelivery.length > 0 && selectedCert.no.includes('certificates')
                  ? `Delivering ${selectedForDelivery.filter(c => !c.delivered).length} certificates`
                  : `Certificate No: ${selectedCert.no}`}
              </p>
              
              {selectedForDelivery.length > 0 && selectedCert.no.includes('certificates') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs sm:text-sm text-blue-800 font-medium">
                    Selected Certificates:
                  </p>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {selectedForDelivery.filter(c => !c.delivered).map((cert) => (
                      <span key={cert.id} className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs mr-2 mb-1">
                        {cert.no}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">
                    <User size={14} className="inline mr-1" />
                    Receiver Name *
                  </label>
                  <input
                    type="text"
                    value={deliveryData.receiverName}
                    onChange={(e) => setDeliveryData({...deliveryData, receiverName: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Position</label>
                  <input
                    type="text"
                    value={deliveryData.receiverPosition}
                    onChange={(e) => setDeliveryData({...deliveryData, receiverPosition: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryData.deliveryDate}
                    onChange={(e) => setDeliveryData({...deliveryData, deliveryDate: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Signature</label>
                  <input
                    type="text"
                    value={deliveryData.receiverSignature}
                    onChange={(e) => setDeliveryData({...deliveryData, receiverSignature: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={deliveryData.notes}
                    onChange={(e) => setDeliveryData({...deliveryData, notes: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeliveryForm(false);
                    setSelectedCert(null);
                  }}
                  className="px-4 sm:px-6 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedForDelivery.length > 0 && selectedCert.no.includes('certificates')) {
                      confirmBulkDelivery();
                    } else {
                      confirmDelivery();
                    }
                  }}
                  disabled={loading}
                  className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  <Check size={16} />
                  {selectedForDelivery.length > 0 && selectedCert.no.includes('certificates') 
                    ? `Confirm (${selectedForDelivery.filter(c => !c.delivered).length})` 
                    : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Import from Excel</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Required Columns:</h3>
                <ul className="text-xs sm:text-sm space-y-1">
                  <li>• Certificate No. (Required)</li>
                  <li>• Description (Required)</li>
                  <li>• Part No. (Optional)</li>
                  <li>• Serial No. (Optional)</li>
                  <li>• Status (Optional)</li>
                </ul>
              </div>

              <div className="mb-4 sm:mb-6">
                <button
                  onClick={downloadTemplate}
                  className="w-full px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={18} />
                  Download Template
                </button>
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium mb-2">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleImportExcel}
                  disabled={loading}
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 sm:px-6 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Print Components - نفس الكود السابق
const SingleCertificatePrint = ({ cert, index, total }) => (
  <div className="p-12 bg-white" style={{ pageBreakAfter: 'always' }}>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-3 rounded-lg">
          <Plane className="text-white" size={32} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-800">Smart Aviation</div>
          <div className="text-sm text-gray-500">Certificate Management System</div>
        </div>
      </div>
    </div>

    <div className="text-center mb-8 border-b-4 border-blue-600 pb-4">
      <h1 className="text-3xl font-bold mb-2">CERTIFICATE DELIVERY RECEIPT</h1>
    </div>

    <div className="grid grid-cols-2 gap-8 mb-8">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 font-semibold">Certificate No.</p>
          <p className="text-xl font-bold break-words">{cert.no}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-semibold">Description</p>
          <p className="text-base leading-relaxed break-words" style={{ maxHeight: '4.5em', overflow: 'hidden' }}>
            {cert.description}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-semibold">Part No.</p>
          <p className="text-base break-words">{cert.partNo || 'N/A'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 font-semibold">Serial No.</p>
          <p className="text-base break-words">{cert.serialNo || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-semibold">Status</p>
          <p className="text-base break-words">{cert.status}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-semibold">Issue Date</p>
          <p className="text-base">{cert.createdDate}</p>
        </div>
      </div>
    </div>

    {cert.delivered && cert.deliveryInfo ? (
      <div className="border-t-2 pt-6 mt-8">
        <h2 className="text-xl font-bold mb-4">DELIVERY INFORMATION</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 font-semibold">Receiver Name</p>
            <p className="text-base font-semibold break-words">{cert.deliveryInfo.receiverName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Position</p>
            <p className="text-base break-words">{cert.deliveryInfo.receiverPosition}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Delivery Date</p>
            <p className="text-base">{cert.deliveryInfo.deliveryDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Signature</p>
            <p className="text-base italic break-words">{cert.deliveryInfo.receiverSignature}</p>
          </div>
        </div>
        {cert.deliveryInfo.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 font-semibold">Notes</p>
            <p className="text-sm break-words" style={{ maxHeight: '3em', overflow: 'hidden' }}>
              {cert.deliveryInfo.notes}
            </p>
          </div>
        )}
      </div>
    ) : (
      <div className="border-t-2 pt-6 mt-8">
        <h2 className="text-xl font-bold mb-6">DELIVERY ACKNOWLEDGMENT</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold mb-2">Receiver Name:</p>
              <div className="border-b-2 border-gray-400 h-10"></div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Position:</p>
              <div className="border-b-2 border-gray-400 h-10"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold mb-2">Date:</p>
              <div className="border-b-2 border-gray-400 h-10"></div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Signature:</p>
              <div className="border-b-2 border-gray-400 h-10"></div>
            </div>
          </div>
        </div>
      </div>
    )}

    {total && (
      <div className="mt-12 pt-6 border-t text-xs text-gray-500 flex justify-between">
        <span>Certificate ID: {cert.id}</span>
        <span>Page {index + 1} of {total}</span>
      </div>
    )}
  </div>
);

const CombinedCertificatesPrint = ({ certificates }) => (
  <div className="p-12 bg-white">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-3 rounded-lg">
          <Plane className="text-white" size={32} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-800">Smart Aviation</div>
          <div className="text-sm text-gray-500">Certificate Management System</div>
        </div>
      </div>
    </div>

    <div className="text-center mb-8 border-b-4 border-blue-600 pb-4">
      <h1 className="text-3xl font-bold mb-2">CERTIFICATES DELIVERY RECEIPT</h1>
      <p className="text-lg font-semibold mt-2">Total: {certificates.length}</p>
    </div>

    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">CERTIFICATES LIST</h2>
      <table className="w-full border-2">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-3 text-left">#</th>
            <th className="border px-4 py-3 text-left">Certificate No.</th>
            <th className="border px-4 py-3 text-left">Description</th>
            <th className="border px-4 py-3 text-left">Part No.</th>
            <th className="border px-4 py-3 text-left">Serial No.</th>
            <th className="border px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {certificates.map((cert, idx) => (
            <tr key={cert.id}>
              <td className="border px-4 py-2">{idx + 1}</td>
              <td className="border px-4 py-2 font-semibold">{cert.no}</td>
              <td className="border px-4 py-2">{cert.description}</td>
              <td className="border px-4 py-2">{cert.partNo || '-'}</td>
              <td className="border px-4 py-2">{cert.serialNo || '-'}</td>
              <td className="border px-4 py-2">{cert.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="border-t-2 pt-8 mt-8">
      <h2 className="text-xl font-bold mb-6">DELIVERY ACKNOWLEDGMENT</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-semibold mb-2">Receiver Name:</p>
            <div className="border-b-2 border-gray-400 h-12"></div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Position:</p>
            <div className="border-b-2 border-gray-400 h-12"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-semibold mb-2">Date:</p>
            <div className="border-b-2 border-gray-400 h-12"></div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Signature:</p>
            <div className="border-b-2 border-gray-400 h-12"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default CertificateManagementSystem;