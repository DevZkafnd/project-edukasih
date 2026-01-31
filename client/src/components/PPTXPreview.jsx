import React from 'react';

const PPTXPreview = ({ url }) => {
  if (!url) return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
          <p>URL tidak tersedia untuk preview.</p>
      </div>
  );

  // --- FIX: UBAH RELATIVE PATH JADI ABSOLUTE URL ---
  
  // 1. Ambil domain website saat ini (misal: `https://edukasih.my.id`)
  const baseUrl = window.location.origin;

  // 2. Gabungkan domain + path file
  // Logic: Jika url tidak diawali "http", gabungkan dengan baseUrl
  const fullUrl = url.startsWith('http') 
    ? url 
    : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

  console.log("[PPTXPreview] Final Full URL:", fullUrl);
  // Sekarang harusnya jadi: `https://edukasih.my.id/uploads/1769...pptx`
  // ---------------------------------------------------

  // Encode URL agar aman dibaca server Microsoft
  const encodedUrl = encodeURIComponent(fullUrl);
  
  // URL Magic dari Microsoft Office Web Viewer
  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;

  return (
    <div className="w-full h-full bg-gray-100 relative">
      <iframe 
        src={viewerUrl} 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        title="PPTX Viewer" 
        className="w-full h-full" 
        allowFullScreen={true} 
      > 
        Browser Anda tidak mendukung iframe. 
      </iframe> 
    </div>
  );
};

export default PPTXPreview;
