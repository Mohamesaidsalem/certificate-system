import React, { useState, useEffect } from 'react';
import { Search, Printer, Plus, Check, X, FileText, Calendar, User, CheckSquare, Square, ChevronDown, Upload, Download, Edit, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const CertificateManagementSystem = () => {
  const [certificates, setCertificates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedForPrint, setSelectedForPrint] = useState([]);
  const [printMode, setPrintMode] = useState(''); // 'single', 'separate', 'combined'
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

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
    
    // Reset print mode after printing
    const afterPrint = () => {
      setPrintMode('');
    };
    
    window.addEventListener('afterprint', afterPrint);
    
    return () => {
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  const loadCertificates = async () => {
    try {
      const result = await window.storage.get('certificates');
      if (result && result.value) {
        setCertificates(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No existing data found');
    }
  };

  const saveCertificates = async (data) => {
    try {
      await window.storage.set('certificates', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving certificates:', error);
    }
  };

  const handleAddCertificate = () => {
    if (!formData.no || !formData.description) {
      alert('Please enter at least Number and Description');
      return;
    }

    if (editMode && selectedCert) {
      // Update existing certificate
      const updatedCerts = certificates.map(cert => 
        cert.id === selectedCert.id 
          ? { ...cert, ...formData }
          : cert
      );
      setCertificates(updatedCerts);
      saveCertificates(updatedCerts);
      alert('Certificate updated successfully');
    } else {
      // Add new certificate
      const newCert = {
        id: Date.now(),
        ...formData,
        createdDate: new Date().toISOString().split('T')[0],
        delivered: false,
        deliveryInfo: null
      };
      const updatedCerts = [...certificates, newCert];
      setCertificates(updatedCerts);
      saveCertificates(updatedCerts);
    }
    
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

  const handleDeleteCertificate = (cert) => {
    if (window.confirm(`Are you sure you want to delete Certificate No: ${cert.no}?`)) {
      const updatedCerts = certificates.filter(c => c.id !== cert.id);
      setCertificates(updatedCerts);
      saveCertificates(updatedCerts);
      setSelectedForPrint(prev => prev.filter(c => c.id !== cert.id));
      alert('Certificate deleted successfully!');
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

  const confirmDelivery = () => {
    if (!deliveryData.receiverName) {
      alert('Please enter receiver name');
      return;
    }

    const updatedCerts = certificates.map(cert => {
      if (cert.id === selectedCert.id) {
        return {
          ...cert,
          delivered: true,
          deliveryInfo: deliveryData
        };
      }
      return cert;
    });

    setCertificates(updatedCerts);
    saveCertificates(updatedCerts);
    setShowDeliveryForm(false);
    setSelectedCert(null);
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
    if (selectedForPrint.length === filteredCertificates.length) {
      setSelectedForPrint([]);
    } else {
      setSelectedForPrint([...filteredCertificates]);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = selectedForPrint.length > 0 ? selectedForPrint : certificates;
    
    if (dataToExport.length === 0) {
      alert('No certificates to export');
      return;
    }

    const exportData = dataToExport.map(cert => ({
      'Certificate No.': cert.no,
      'Description': cert.description,
      'Part No.': cert.partNo || '',
      'Serial No.': cert.serialNo || '',
      'Status': cert.status,
      'Created Date': cert.createdDate,
      'Delivered': cert.delivered ? 'Yes' : 'No',
      'Receiver Name': cert.deliveryInfo?.receiverName || '',
      'Receiver Position': cert.deliveryInfo?.receiverPosition || '',
      'Delivery Date': cert.deliveryInfo?.deliveryDate || '',
      'Signature': cert.deliveryInfo?.receiverSignature || '',
      'Notes': cert.deliveryInfo?.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Certificates');
    
    // Auto-size columns
    const maxWidth = exportData.reduce((w, r) => Math.max(w, r['Description']?.length || 0), 10);
    ws['!cols'] = [
      { wch: 15 }, // Certificate No.
      { wch: Math.min(maxWidth, 50) }, // Description
      { wch: 15 }, // Part No.
      { wch: 15 }, // Serial No.
      { wch: 10 }, // Status
      { wch: 12 }, // Created Date
      { wch: 10 }, // Delivered
      { wch: 20 }, // Receiver Name
      { wch: 20 }, // Receiver Position
      { wch: 12 }, // Delivery Date
      { wch: 20 }, // Signature
      { wch: 30 }  // Notes
    ];

    const fileName = `Certificates_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    alert(`Exported ${dataToExport.length} certificate(s) to ${fileName}`);
  };

  const handleImportExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const importedCerts = jsonData.map(row => ({
          id: Date.now() + Math.random(),
          no: row['Certificate No.'] || row['No.'] || '',
          description: row['Description'] || '',
          partNo: row['Part No.'] || '',
          serialNo: row['Serial No.'] || '',
          status: row['Status'] || 'New',
          createdDate: row['Created Date'] || new Date().toISOString().split('T')[0],
          delivered: false,
          deliveryInfo: null
        })).filter(cert => cert.no && cert.description); // Only import valid entries

        if (importedCerts.length === 0) {
          alert('No valid certificates found in the file. Please ensure the file has "Certificate No." and "Description" columns.');
          return;
        }

        const updatedCerts = [...certificates, ...importedCerts];
        setCertificates(updatedCerts);
        saveCertificates(updatedCerts);
        setShowImportModal(false);
        alert(`Successfully imported ${importedCerts.length} certificate(s)`);
      } catch (error) {
        alert('Error reading file. Please make sure it is a valid Excel file.');
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Certificate No.': 'CERT-001',
        'Description': 'Sample Certificate Description',
        'Part No.': 'PART-123',
        'Serial No.': 'SN-456789',
        'Status': 'New'
      },
      {
        'Certificate No.': 'CERT-002',
        'Description': 'Another Sample Certificate',
        'Part No.': 'PART-124',
        'Serial No.': 'SN-456790',
        'Status': 'Active'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    ws['!cols'] = [
      { wch: 15 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 }
    ];

    XLSX.writeFile(wb, 'Certificate_Import_Template.xlsx');
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.serialNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'delivered' && cert.delivered) ||
      (filterStatus === 'pending' && !cert.delivered);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: certificates.length,
    delivered: certificates.filter(c => c.delivered).length,
    pending: certificates.filter(c => !c.delivered).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
            break-after: page;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
        .print-content {
          display: ${printMode ? 'block' : 'none'};
        }
      `}</style>

      {/* Print Section */}
      <div id="print-area" className="print-content">
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

      {/* Main Screen */}
      <div className="print:hidden">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <FileText className="text-blue-600" size={32} />
                  Certificate Delivery Management System
                </h1>
                <p className="text-gray-600 mt-1">Track and manage certificate deliveries</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-md"
                >
                  <Upload size={18} />
                  Import Excel
                </button>
                <button
                  onClick={handleExportExcel}
                  className="bg-purple-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-md"
                >
                  <Download size={18} />
                  Export Excel
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
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Plus size={20} />
                  Add New
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <p className="text-sm opacity-90">Total Certificates</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
                <p className="text-sm opacity-90">Delivered</p>
                <p className="text-3xl font-bold">{stats.delivered}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                <p className="text-sm opacity-90">Pending</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
            </div>
            {selectedForPrint.length > 0 && (
              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  <strong>{selectedForPrint.length}</strong> certificate(s) selected for export/print
                </p>
              </div>
            )}
          </div>

          {/* Filters and Bulk Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by No., Description, Part No., or Serial No."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Certificates</option>
                  <option value="pending">Not Delivered</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAllForPrint}
                  className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  {selectedForPrint.length === filteredCertificates.length && filteredCertificates.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowPrintMenu(!showPrintMenu)}
                    disabled={selectedForPrint.length === 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Printer size={16} />
                    Print ({selectedForPrint.length})
                    <ChevronDown size={16} />
                  </button>
                  {showPrintMenu && selectedForPrint.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                      <button
                        onClick={handlePrintSeparate}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <div className="font-medium text-gray-800">Print Separate Pages</div>
                        <div className="text-xs text-gray-500">Each certificate on its own page</div>
                      </button>
                      <button
                        onClick={handlePrintCombined}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-gray-800">Print Combined Receipt</div>
                        <div className="text-xs text-gray-500">One receipt with all certificate numbers</div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Certificates List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <button
                        onClick={selectAllForPrint}
                        className="text-gray-700 hover:text-blue-600"
                      >
                        {selectedForPrint.length === filteredCertificates.length && filteredCertificates.length > 0 ? 
                          <CheckSquare size={18} /> : <Square size={18} />
                        }
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">No.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Part No.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Serial No.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Delivery</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                        No certificates found
                      </td>
                    </tr>
                  ) : (
                    filteredCertificates.map(cert => (
                      <tr key={cert.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleSelectForPrint(cert.id)}
                            className="text-gray-700 hover:text-blue-600"
                          >
                            {selectedForPrint.find(c => c.id === cert.id) ? 
                              <CheckSquare size={18} className="text-blue-600" /> : 
                              <Square size={18} />
                            }
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{cert.no}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{cert.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{cert.partNo || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{cert.serialNo || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {cert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {cert.delivered ? (
                            <div>
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                <Check size={16} />
                                Delivered
                              </span>
                              <span className="text-xs text-gray-500">
                                {cert.deliveryInfo.deliveryDate}
                              </span>
                            </div>
                          ) : (
                            <span className="flex items-center gap-1 text-orange-600 font-medium">
                              <X size={16} />
                              Not Delivered
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => handleEditCertificate(cert)}
                              className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors text-xs flex items-center gap-1"
                              title="Edit Certificate"
                            >
                              <Edit size={12} />
                            </button>
                            {!cert.delivered && (
                              <button
                                onClick={() => handleDelivery(cert)}
                                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors text-xs flex items-center gap-1"
                                title="Mark as Delivered"
                              >
                                <Check size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => handlePrintSingle(cert)}
                              className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors flex items-center gap-1 text-xs"
                              title="Print Certificate"
                            >
                              <Printer size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCertificate(cert);
                              }}
                              className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors text-xs flex items-center gap-1"
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
          </div>
        </div>

        {/* Add/Edit Certificate Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                {editMode ? 'Edit Certificate' : 'Add New Certificate'}
              </h2>
              {editMode && (
                <p className="text-sm text-blue-600 mb-4">
                  Editing Certificate No: {selectedCert?.no}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate No. *
                  </label>
                  <input
                    type="text"
                    value={formData.no}
                    onChange={(e) => setFormData({...formData, no: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <input
                    type="text"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Part No.
                  </label>
                  <input
                    type="text"
                    value={formData.partNo}
                    onChange={(e) => setFormData({...formData, partNo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial No.
                  </label>
                  <input
                    type="text"
                    value={formData.serialNo}
                    onChange={(e) => setFormData({...formData, serialNo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditMode(false);
                    setSelectedCert(null);
                    setFormData({
                      no: '',
                      description: '',
                      partNo: '',
                      serialNo: '',
                      status: 'New'
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCertificate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editMode ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Modal */}
        {showDeliveryForm && selectedCert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Certificate Delivery</h2>
              <p className="text-gray-600 mb-6">Certificate No: {selectedCert.no}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-1" />
                    Receiver Name *
                  </label>
                  <input
                    type="text"
                    value={deliveryData.receiverName}
                    onChange={(e) => setDeliveryData({...deliveryData, receiverName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position / Title
                  </label>
                  <input
                    type="text"
                    value={deliveryData.receiverPosition}
                    onChange={(e) => setDeliveryData({...deliveryData, receiverPosition: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryData.deliveryDate}
                    onChange={(e) => setDeliveryData({...deliveryData, deliveryDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signature (Name)
                  </label>
                  <input
                    type="text"
                    value={deliveryData.receiverSignature}
                    onChange={(e) => setDeliveryData({...deliveryData, receiverSignature: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="For verification"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={deliveryData.notes}
                    onChange={(e) => setDeliveryData({...deliveryData, notes: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeliveryForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelivery}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check size={20} />
                  Confirm Delivery
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Excel Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Import Certificates from Excel</h2>
              <p className="text-gray-600 mb-6">Upload an Excel file with certificate data</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Required Columns:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Certificate No.</strong> (Required)</li>
                  <li>• <strong>Description</strong> (Required)</li>
                  <li>• Part No. (Optional)</li>
                  <li>• Serial No. (Optional)</li>
                  <li>• Status (Optional, default: "New")</li>
                </ul>
              </div>

              <div className="mb-6">
                <button
                  onClick={downloadTemplate}
                  className="w-full px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Download size={20} />
                  Download Excel Template
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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

// Single Certificate Print Component
const SingleCertificatePrint = ({ cert, index, total }) => (
  <div className="p-12 bg-white">
    <div className="text-center mb-8 border-b-4 border-blue-600 pb-4">
      <h1 className="text-3xl font-bold mb-2">CERTIFICATE DELIVERY RECEIPT</h1>
      <p className="text-gray-600">إذن تسليم شهادة</p>
    </div>

    <div className="grid grid-cols-2 gap-8 mb-8">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 font-semibold">Certificate No.</p>
          <p className="text-xl font-bold">{cert.no}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-semibold">Description</p>
          <p className="text-lg">{cert.description}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-semibold">Part No.</p>
          <p className="text-lg">{cert.partNo || 'N/A'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 font-semibold">Serial No.</p>
          <p className="text-lg">{cert.serialNo || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-semibold">Status</p>
          <p className="text-lg">{cert.status}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-semibold">Issue Date</p>
          <p className="text-lg">{cert.createdDate}</p>
        </div>
      </div>
    </div>

    {cert.delivered && cert.deliveryInfo ? (
      <div className="border-t-2 border-gray-300 pt-6 mt-8">
        <h2 className="text-xl font-bold mb-4">DELIVERY INFORMATION</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Receiver Name</p>
              <p className="text-lg font-semibold">{cert.deliveryInfo.receiverName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Position</p>
              <p className="text-lg">{cert.deliveryInfo.receiverPosition}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Delivery Date</p>
              <p className="text-lg">{cert.deliveryInfo.deliveryDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-2">Signature</p>
              <div className="border-b-2 border-black w-48 h-16 flex items-end pb-2">
                <p className="text-lg italic font-semibold">{cert.deliveryInfo.receiverSignature}</p>
              </div>
            </div>
          </div>
        </div>

        {cert.deliveryInfo.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 font-semibold">Notes</p>
            <p className="text-base">{cert.deliveryInfo.notes}</p>
          </div>
        )}
      </div>
    ) : (
      <div className="border-t-2 border-gray-300 pt-6 mt-8">
        <h2 className="text-xl font-bold mb-6">DELIVERY ACKNOWLEDGMENT</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-2">Receiver Name:</p>
              <div className="border-b-2 border-gray-400 h-10"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-2">Position:</p>
              <div className="border-b-2 border-gray-400 h-10"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-2">Date:</p>
              <div className="border-b-2 border-gray-400 h-10"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-2">Signature:</p>
              <div className="border-b-2 border-gray-400 h-10"></div>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 italic mt-6">
          I acknowledge receipt of the original certificate described above.
        </p>
      </div>
    )}

    <div className="mt-12 pt-6 border-t border-gray-300">
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
        <div>
          <p className="font-semibold">Certificate ID: {cert.id}</p>
          <p>Printed on: {new Date().toLocaleString('en-US')}</p>
        </div>
        {total && (
          <div className="text-right">
            <p>Page {index + 1} of {total}</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Combined Certificates Print Component
const CombinedCertificatesPrint = ({ certificates }) => (
  <div className="p-12 bg-white">
    <div className="text-center mb-8 border-b-4 border-blue-600 pb-4">
      <h1 className="text-3xl font-bold mb-2">CERTIFICATES DELIVERY RECEIPT</h1>
      <p className="text-gray-600">إذن تسليم شهادات</p>
      <p className="text-lg font-semibold mt-2 text-blue-600">
        Total Certificates: {certificates.length}
      </p>
    </div>

    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800">CERTIFICATES LIST</h2>
      <table className="w-full border-2 border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">#</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Certificate No.</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Description</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Part No.</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Serial No.</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {certificates.map((cert, idx) => (
            <tr key={cert.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-4 py-2 text-sm">{idx + 1}</td>
              <td className="border border-gray-300 px-4 py-2 text-sm font-semibold">{cert.no}</td>
              <td className="border border-gray-300 px-4 py-2 text-sm">{cert.description}</td>
              <td className="border border-gray-300 px-4 py-2 text-sm">{cert.partNo || '-'}</td>
              <td className="border border-gray-300 px-4 py-2 text-sm">{cert.serialNo || '-'}</td>
              <td className="border border-gray-300 px-4 py-2 text-sm">{cert.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="border-t-2 border-gray-300 pt-8 mt-8">
      <h2 className="text-xl font-bold mb-6">DELIVERY ACKNOWLEDGMENT</h2>
      <p className="text-sm text-gray-700 mb-6">
        I hereby acknowledge receipt of the above-mentioned {certificates.length} certificate(s) in their original form.
      </p>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-2">Receiver Name:</p>
            <div className="border-b-2 border-gray-400 h-12"></div>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-2">Position / Title:</p>
            <div className="border-b-2 border-gray-400 h-12"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-2">Date:</p>
            <div className="border-b-2 border-gray-400 h-12"></div>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-2">Signature:</p>
            <div className="border-b-2 border-gray-400 h-12"></div>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-semibold mb-2">Notes / Comments:</p>
          <div className="border-2 border-gray-400 h-24"></div>
        </div>
      </div>
    </div>

    <div className="mt-12 pt-6 border-t border-gray-300">
      <div className="text-xs text-gray-500">
        <p className="font-semibold">Document ID: BATCH-{Date.now()}</p>
        <p>Printed on: {new Date().toLocaleString('en-US')}</p>
        <p className="mt-2 text-gray-600">
          This document serves as an official receipt for the delivery of {certificates.length} certificate(s).
        </p>
      </div>
    </div>
  </div>
);

export default CertificateManagementSystem;