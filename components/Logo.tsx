import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-white/5 border border-white/20 backdrop-blur-md shadow-lg transform rotate-3"></div>
            {/* Inner Graphic */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 shadow-[0_0_15px_rgba(253,186,116,0.6)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/30 rounded-full scale-0 animate-[ping_3s_ease-in-out_infinite]"></div>
                </div>
                {/* Crescent Overlay for stylized B look */}
                <div className="absolute w-5 h-5 rounded-full bg-transparent border-t-2 border-r-2 border-white/80 -rotate-12 transform translate-x-1 -translate-y-1"></div>
            </div>
        </div>
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-white leading-none">BrightSide</h1>
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/50">Atmospheric Intelligence</span>
        </div>
    </div>
  );
};

export default Logo;