import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash, Save, CheckCircle, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const QuizEditorPage = () => {
  const { materiId } = useParams();
  const navigate = useNavigate();
  const [materi, setMateri] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const materiRes = await axios.get('http://localhost:5000/api/materi');
      const foundMateri = materiRes.data.find(m => m._id === materiId);
      setMateri(foundMateri);

      try {
        const quizRes = await axios.get(`http://localhost:5000/api/kuis/${materiId}`);
        if (quizRes.data && quizRes.data.pertanyaan) {
          const loadedQuestions = quizRes.data.pertanyaan.map(q => ({
            ...q,
            tipe_media: q.gambar_soal && !q.gambar_soal.startsWith('/uploads') ? 'link' : 'upload'
          }));
          setQuestions(loadedQuestions);
        }
      } catch {
        console.warn("Quiz data not available for materiId:", materiId);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  }, [materiId]);

  useEffect(() => {
    const id = setTimeout(fetchData, 0);
    return () => clearTimeout(id);
  }, [fetchData]);


  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        teks_pertanyaan: '',
        gambar_soal: '',
        tipe_media: 'upload', // Default UI state
        opsi_jawaban: [
          { teks: '' },
          { teks: '' },
          { teks: '' }
        ],
        indeks_jawaban_benar: 0
      }
    ]);
  };

  const removeQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].opsi_jawaban[oIndex].teks = value;
    setQuestions(newQuestions);
  };

  const handleFileUpload = async (file, index) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      updateQuestion(index, 'gambar_soal', res.data.url);
      toast.success('Gambar berhasil diupload');
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Gagal mengupload gambar.");
    }
  };

  const handleSave = async () => {
    if (!questions.length) {
      toast.error("Minimal harus ada 1 pertanyaan!");
      return;
    }

    // Validate empty fields
    for (let q of questions) {
        if (!q.teks_pertanyaan) {
            toast.error("Ada pertanyaan yang belum diisi!");
            return;
        }
        if (!q.gambar_soal) {
            toast.error("Setiap pertanyaan WAJIB memiliki gambar soal!");
            return;
        }
        for (let o of q.opsi_jawaban) {
            if (!o.teks) {
                toast.error("Ada opsi jawaban yang kosong!");
                return;
            }
        }
    }

    setSaving(true);
    const toastId = toast.loading('Menyimpan kuis...');
    try {
      // Clean up UI-only fields like 'tipe_media' before sending if strictly needed, 
      // but Mongoose usually ignores unknown fields. We send it as is.
      await axios.post('http://localhost:5000/api/kuis', {
        materi: materiId,
        pertanyaan: questions
      });
      toast.success('Kuis berhasil disimpan!', { id: toastId });
      navigate('/dashboard-guru');
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error('Gagal menyimpan kuis.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Memuat Editor...</div>;
  if (!materi) return <div className="p-10 text-center">Materi tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard-guru" className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Editor Kuis</h1>
              <p className="text-sm text-gray-500">Materi: {materi.judul}</p>
            </div>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-brand-blue text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : <><Save size={18} /> Simpan Kuis</>}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative group">
            <button 
              onClick={() => removeQuestion(qIndex)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
              title="Hapus Pertanyaan"
            >
              <Trash size={20} />
            </button>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan #{qIndex + 1}</label>
              <textarea 
                value={q.teks_pertanyaan || ''}
                onChange={(e) => updateQuestion(qIndex, 'teks_pertanyaan', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                placeholder="Tulis pertanyaan di sini..."
                rows="2"
              />
            </div>

            {/* Media Section */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Image size={16} /> Gambar Soal (Wajib)
                </label>
                
                <div className="flex items-center gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input 
                            type="radio" 
                            name={`media_type_${qIndex}`}
                            checked={q.tipe_media === 'upload'}
                            onChange={() => updateQuestion(qIndex, 'tipe_media', 'upload')}
                            className="text-brand-blue"
                        />
                        Upload Gambar
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input 
                            type="radio" 
                            name={`media_type_${qIndex}`}
                            checked={q.tipe_media === 'link'}
                            onChange={() => updateQuestion(qIndex, 'tipe_media', 'link')}
                            className="text-brand-blue"
                        />
                        Link URL
                    </label>
                </div>

                {q.tipe_media === 'upload' ? (
                    <>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e.target.files[0], qIndex)}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20"
                        />
                        <p className="text-xs text-gray-500 mt-1 pl-2">
                            ⚠️ Format: JPG, PNG, WEBP. Pastikan gambar jelas.
                        </p>
                    </>
                ) : (
                    <>
                        <input 
                            type="text" 
                            value={q.gambar_soal || ''}
                            onChange={(e) => updateQuestion(qIndex, 'gambar_soal', e.target.value)}
                            placeholder="https://example.com/gambar.jpg"
                            className="w-full p-2 text-sm border rounded-lg outline-none focus:border-brand-blue"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            ⚠️ Gunakan Direct Link (akhiran .jpg/.png) agar gambar muncul.
                        </p>
                    </>
                )}

                {/* Preview */}
                {q.gambar_soal && (
                    <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Preview:</p>
                        <img 
                            src={q.gambar_soal.startsWith('/') ? `http://localhost:5000${q.gambar_soal}` : q.gambar_soal} 
                            alt="Preview Soal" 
                            className="h-32 object-contain rounded-md border bg-white"
                            onError={(e) => e.target.style.display = 'none'} 
                        />
                    </div>
                )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Opsi Jawaban</label>
              {q.opsi_jawaban.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <div 
                    onClick={() => updateQuestion(qIndex, 'indeks_jawaban_benar', oIndex)}
                    className={`cursor-pointer w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      q.indeks_jawaban_benar === oIndex ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                    }`}
                  >
                    {q.indeks_jawaban_benar === oIndex && <CheckCircle size={14} />}
                  </div>
                  <input 
                    type="text" 
                    value={opt.teks || ''}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    className={`flex-1 p-2 border rounded-lg outline-none focus:border-brand-blue ${
                      q.indeks_jawaban_benar === oIndex ? 'bg-green-50 border-green-200' : ''
                    }`}
                    placeholder={`Pilihan ${String.fromCharCode(65 + oIndex)}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button 
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50 transition flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Tambah Pertanyaan Baru
        </button>
      </div>
    </div>
  );
};

export default QuizEditorPage;
