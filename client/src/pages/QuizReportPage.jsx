import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FileText, Download, ArrowLeft, Search, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

const QuizReportPage = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [reportStats, setReportStats] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJenjangFilter, setSelectedJenjangFilter] = useState('Semua');

  // Fetch all materials initially
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await axios.get('/api/materi');
        setMaterials(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching materials:", error);
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  // Fetch report when material is selected
  const handleSelectMaterial = async (materi) => {
    setSelectedMaterial(materi);
    setLoadingReport(true);
    try {
      // Fetch Report Data (Students & Stats)
      const reportRes = await axios.get(`/api/kuis/report/${materi._id}`);
      setReportData(reportRes.data.data);
      // Ensure stats is always an object
      setReportStats(reportRes.data.stats || {});

      // Fetch Quiz Content (Questions)
      try {
        const quizRes = await axios.get(`/api/kuis/${materi._id}`);
        setQuizQuestions(quizRes.data.pertanyaan || []);
      } catch (err) {
        // If 404, it just means no quiz exists for this material yet.
        // We only warn if it's NOT a 404, to keep console clean.
        if (err.response && err.response.status !== 404) {
             console.warn("Quiz content error:", err);
        }
        setQuizQuestions([]);
      }

      setLoadingReport(false);
    } catch (error) {
      console.error("Error fetching report:", error);
      setReportData([]);
      setReportStats({});
      setLoadingReport(false);
    }
  };

  const generatePDF = () => {
    if (!selectedMaterial || reportData.length === 0) {
        toast.error("Tidak ada data laporan untuk diunduh.");
        return;
    }

    const toastId = toast.loading("Membuat PDF...");

    try {
        const doc = new jsPDF();

        // --- Page 1: Student List ---
        doc.setFontSize(18);
        doc.text(`Laporan Hasil Kuis: ${selectedMaterial.judul}`, 14, 20);
        doc.setFontSize(12);
        doc.text(`Jenjang: ${selectedMaterial.jenjang || '-'}`, 14, 28);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 34);

        const tableColumn = ["No", "Nama Siswa", "Kelas", "Percobaan", "Bintang (0-3)", "Jawaban Siswa", "Waktu"];
        const tableRows = [];

        reportData.forEach((row, index) => {
            // Format answers as A, B, C or -
            const formattedAnswers = row.jawaban 
                ? row.jawaban.map(ans => ans === -1 ? '-' : (ans === 0 ? 'A' : ans === 1 ? 'B' : 'C')).join(', ')
                : '-';

            const rowData = [
                index + 1,
                row.nama,
                row.kelas || '-',
                row.attemptNumber,
                row.skor + ' ⭐',
                formattedAnswers,
                new Date(row.waktu).toLocaleString('id-ID')
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [66, 133, 244] },
            columnStyles: {
                5: { cellWidth: 40 } // Give more space for answers
            }
        });

        // --- Page 2: Question Analysis (Item Analysis) ---
        if (quizQuestions.length > 0) {
            doc.addPage();
            doc.setFontSize(16);
            doc.text(`Analisis Butir Soal (Item Analysis)`, 14, 20);
            doc.setFontSize(10);
            
            // Get total population from first question stats if available
            const totalPop = reportStats[0] ? reportStats[0].totalPopulation : 0;
            const totalVotes = reportStats[0] ? reportStats[0].totalVotes : 0; // Approximate from first question
            
            doc.text(`Distribusi jawaban berdasarkan jenjang: ${selectedMaterial.jenjang}`, 14, 28);
            if (totalPop > 0) {
                doc.text(`Total Siswa Jenjang: ${totalPop} | Partisipasi: ${totalVotes} Siswa`, 14, 34);
                currentY = 44;
            } else {
                currentY = 38;
            }

            quizQuestions.forEach((q, qIdx) => {
                // Check if we need a new page
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 20;
                }

                // Question Text
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                const splitTitle = doc.splitTextToSize(`${qIdx + 1}. ${q.teks_pertanyaan}`, 180);
                doc.text(splitTitle, 14, currentY);
                currentY += (splitTitle.length * 5) + 2;

                // Stats Table for this question
                const stats = reportStats[qIdx];
                const statRows = [];
                
                q.opsi_jawaban.forEach((opt, optIdx) => {
                    const isCorrect = q.indeks_jawaban_benar === optIdx;
                    const count = stats && stats.distribution ? (stats.distribution[optIdx] || 0) : 0;
                    const percent = stats && stats.percentages ? (stats.percentages[optIdx] || 0) : 0;
                    
                    statRows.push([
                        optIdx === 0 ? 'A' : optIdx === 1 ? 'B' : 'C',
                        opt.teks + (isCorrect ? ' (Kunci Jawaban)' : ''),
                        `${count} Siswa`,
                        `${percent}%`
                    ]);
                });

                autoTable(doc, {
                    head: [['Opsi', 'Jawaban', 'Jumlah Memilih', 'Persentase']],
                    body: statRows,
                    startY: currentY,
                    theme: 'striped',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [100, 100, 100] },
                    columnStyles: {
                        0: { cellWidth: 15, halign: 'center' },
                        2: { cellWidth: 30, halign: 'center' },
                        3: { cellWidth: 25, halign: 'center' }
                    },
                    margin: { left: 14 }
                });

                currentY = doc.lastAutoTable.finalY + 15;
            });
        }

        doc.save(`Laporan_Kuis_${selectedMaterial.judul.replace(/\s+/g, '_')}.pdf`);
        toast.success("PDF Berhasil Diunduh!", { id: toastId });
    } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("Gagal membuat PDF. Silakan coba lagi.", { id: toastId });
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchSearch = m.judul.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenjang = selectedJenjangFilter === 'Semua' || m.jenjang === selectedJenjangFilter;
    return matchSearch && matchJenjang;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link to="/dashboard-guru" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft className="text-gray-600" />
                </Link>
                <div className="flex items-center gap-2">
                    <Logo className="w-8 h-8" />
                    <h1 className="text-xl font-bold text-gray-800">Laporan Hasil Kuis</h1>
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar: Material List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[80vh] flex flex-col">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="text-brand-blue" /> Pilih Materi
                </h2>
                
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Cari materi..." 
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={selectedJenjangFilter}
                        onChange={(e) => setSelectedJenjangFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white text-gray-600 text-sm"
                    >
                        <option value="Semua">Semua Jenjang</option>
                        <option value="TK">TK</option>
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {loading ? (
                        <p className="text-center text-gray-400 py-4">Memuat materi...</p>
                    ) : filteredMaterials.length === 0 ? (
                        <p className="text-center text-gray-400 py-4">Tidak ada materi ditemukan.</p>
                    ) : (
                        filteredMaterials.map(materi => (
                            <button
                                key={materi._id}
                                onClick={() => handleSelectMaterial(materi)}
                                className={`w-full text-left p-4 rounded-xl transition border ${
                                    selectedMaterial?._id === materi._id 
                                    ? 'bg-blue-50 border-brand-blue text-brand-blue' 
                                    : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                                <h3 className="font-bold line-clamp-1">{materi.judul}</h3>
                                <div className="flex items-center gap-2 mt-1 text-xs">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-medium">{materi.jenjang}</span>
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-medium uppercase">{materi.kategori}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content: Report Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-[80vh] flex flex-col">
                {!selectedMaterial ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <FileText size={64} className="mb-4 opacity-20" />
                        <p className="text-lg">Pilih materi di samping untuk melihat laporan.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{selectedMaterial.judul}</h2>
                                <p className="text-gray-500">Laporan Pengerjaan Kuis • Jenjang {selectedMaterial.jenjang}</p>
                            </div>
                            <button 
                                onClick={generatePDF}
                                disabled={reportData.length === 0}
                                className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-95"
                            >
                                <Download size={20} />
                                Download PDF
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto border border-gray-200 rounded-xl">
                            {loadingReport ? (
                                <div className="p-8 text-center text-gray-500">Mengambil data laporan...</div>
                            ) : reportData.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                                    <Filter size={48} className="mb-4 text-gray-300" />
                                    <p>Belum ada siswa yang mengerjakan kuis ini.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4 font-bold text-gray-600 border-b border-gray-200">No</th>
                                            <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Nama Siswa</th>
                                            <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Kelas</th>
                                            <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-center">Percobaan</th>
                                            <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-center">Skor</th>
                                            <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Jawaban Siswa</th>
                                            <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {reportData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/50 transition">
                                                <td className="p-4 text-gray-500">{idx + 1}</td>
                                                <td className="p-4 font-bold text-gray-800">{row.nama}</td>
                                                <td className="p-4 text-gray-600">{row.kelas || '-'}</td>
                                                <td className="p-4 text-center">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                                                        #{row.attemptNumber}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="inline-flex items-center gap-1 font-bold text-brand-yellow">
                                                        {row.skor} <span className="text-gray-400 font-normal text-xs">Bintang</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-mono text-gray-600">
                                                    {row.jawaban 
                                                        ? row.jawaban.map(ans => ans === -1 ? '-' : (ans === 0 ? 'A' : ans === 1 ? 'B' : 'C')).join(', ')
                                                        : '-'}
                                                </td>
                                                <td className="p-4 text-right text-sm text-gray-500">
                                                    {new Date(row.waktu).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default QuizReportPage;
