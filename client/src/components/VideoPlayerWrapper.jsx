import React from 'react';

const VideoPlayerWrapper = ({ url }) => {
  const getVideoId = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    if (match && match[2] && match[2].length === 11) return match[2];
    return null;
  };

  const vid = getVideoId(url);
  if (!vid) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-brand-yellow bg-gray-100 p-6 text-center text-gray-600">
        Link YouTube tidak valid atau tidak didukung.
      </div>
    );
  }

  const embed = `https://www.youtube.com/embed/${vid}`;
  return (
    <div className="relative w-full pb-[56.25%] h-0 rounded-2xl overflow-hidden shadow-xl border-4 border-brand-yellow">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={embed}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default VideoPlayerWrapper;
