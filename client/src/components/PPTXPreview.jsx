import React, { useEffect, useRef, useState } from 'react';

const PPTXPreview = ({ file, url }) => {
  const previewRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to process the file (ArrayBuffer)
    const processPPTX = (data) => {
        if (window.$ && window.$.fn.pptxToHtml) {
            window.$("#pptx-result").html("");
            try {
                window.$("#pptx-result").pptxToHtml({
                    fileInput: null,
                    fileData: data,
                    slideMode: true,
                    keyBoardShortCut: true,
                    slideModeConfig: {
                        first: 1,
                        nav: true,
                        navTxtColor: "white",
                        showSlideNum: true,
                        showTotalSlideNum: true,
                        autoSlide: false,
                        randomAutoSlide: false,
                        loop: false,
                        background: false,
                        transition: "default",
                        transitionTime: 1
                    }
                });
                setLoading(false);
            } catch (err) {
                console.error("PPTXjs error:", err);
                setError("Gagal memproses file PPTX.");
                setLoading(false);
            }
        } else {
            setError("Library PPTXjs belum siap. Coba refresh halaman.");
            setLoading(false);
        }
    };

    if (file) {
        setLoading(true);
        console.log("[PPTXPreview] Processing file object:", file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            processPPTX(e.target.result);
        };
        reader.readAsArrayBuffer(file);
    } else if (url) {
        setLoading(true);
        console.log("[PPTXPreview] Fetching URL:", url);
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.arrayBuffer();
            })
            .then(data => {
                processPPTX(data);
            })
            .catch(err => {
                console.error("[PPTXPreview] Fetch error:", err);
                setError(`Gagal mengunduh file PPTX (${err.message}).`);
                setLoading(false);
            });
    } else {
        console.warn("[PPTXPreview] No file or URL provided");
    }

    // Cleanup function to remove event listeners and clear content
    return () => {
        if (window.$) {
            window.$("#pptx-result").html("");
            // Remove keyboard listeners attached by pptxjs to prevent "Input Teks Macet"
            // Note: pptxjs likely attaches to document/window without namespace
            window.$(document).off("keyup"); 
            window.$(document).off("keydown");
        }
    };
  }, [file, url]);

  const toggleFullscreen = () => {
    const elem = previewRef.current;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
        // Fallback or alert if needed, but console.error is better than alert for UX
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change events (ESC key, etc.)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Trigger resize event for responsive content
      window.dispatchEvent(new Event('resize'));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Container Custom untuk Fullscreen */}
      <div 
        ref={previewRef} 
        className={`bg-gray-800 rounded-lg overflow-hidden flex flex-col relative w-full h-full ${isFullscreen ? 'p-10' : ''}`} 
      >
        {/* Header/Controls Custom */}
        <div className="bg-gray-900 text-white p-2 flex justify-between items-center px-4 shrink-0">
          <span className="text-sm font-semibold">Preview Materi (PPTX)</span>
          <button 
            type="button"
            onClick={toggleFullscreen} 
            className="text-xs bg-brand-blue hover:bg-blue-600 px-3 py-1 rounded transition" 
          >
            {isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
          </button>
        </div>

        {/* Loading / Error State */}
        {loading && (
            <div className="flex-1 flex items-center justify-center bg-white text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mr-2"></div>
                Memuat Preview PPT...
            </div>
        )}
        {error && (
            <div className="flex-1 flex items-center justify-center bg-white text-red-500 p-4 text-center">
                {error}
            </div>
        )}

        {/* Div Target untuk PPTXjs */}
        <div id="pptx-result" className="pptx-container w-full flex-1 bg-white overflow-hidden">
          {/* Slide akan dirender di sini oleh jQuery */}
        </div>
      </div>
    </div>
  );
};

export default PPTXPreview;
