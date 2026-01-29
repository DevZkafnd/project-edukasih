import React from 'react';
import { X, Download, FileText, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';
import PPTXPreview from './PPTXPreview';

const DocumentPreviewModal = ({ isOpen, onClose, document, downloadUrl }) => {
  if (!isOpen || !document) return null;

  const fileUrl = document.url_media.startsWith('http') 
    ? document.url_media 
    : `${API_BASE_URL}${document.url_media.startsWith('/') ? document.url_media : '/' + document.url_media}`;

  // Helper to determine if we can preview
  const isPdf = document.url_media.toLowerCase().endsWith('.pdf');
  const isPpt = document.tipe_media === 'ppt' || /\.(ppt|pptx)$/i.test(document.url_media);
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(document.url_media);
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{document.judul}</h3>
              <p className="text-xs text-gray-500">Preview Dokumen</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-100 p-4 overflow-hidden relative flex items-center justify-center">
            {isPdf ? (
                <iframe 
                    src={`${fileUrl}#toolbar=0`}
                    className="w-full h-full rounded-lg shadow-inner bg-white"
                    title="PDF Preview"
                />
            ) : isPpt ? (
                <div className="w-full h-full relative group bg-white rounded-lg shadow-inner overflow-hidden">
                    <PPTXPreview url={fileUrl} />
                </div>
            ) : isImage ? (
                <img 
                    src={fileUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
            ) : (
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                        <AlertCircle size={40} />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Preview Tidak Tersedia</h4>
                    <p className="text-gray-500 mb-6">
                        Format file ini tidak mendukung preview langsung di browser (kecuali PDF, Gambar, atau PPT Online). Silakan download untuk melihat isinya.
                    </p>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-6 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition"
            >
                Tutup
            </button>
            <a 
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 rounded-xl font-bold text-white bg-brand-blue hover:bg-blue-600 transition shadow-lg flex items-center gap-2"
            >
                <Download size={20} />
                Download File
            </a>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
