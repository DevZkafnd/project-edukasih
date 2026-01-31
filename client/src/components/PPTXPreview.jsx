import React from 'react';

const PPTXPreview = ({ url }) => {
  if (!url) return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
          <p>URL tidak tersedia untuk preview.</p>
      </div>
  );
  
  // Pastikan URL di-encode agar aman
  const encodedUrl = encodeURIComponent(url);
  
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
