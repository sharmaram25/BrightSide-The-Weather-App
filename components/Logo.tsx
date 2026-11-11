import React from 'react';

/** BrightSide mark: a sun rising over the horizon. */
const Logo: React.FC<{ size?: number; withText?: boolean }> = ({ size = 40, withText = true }) => (
  <div className="flex items-center gap-3">
    <img src="/icon.svg" width={size} height={size} alt="" className="rounded-[22%] shadow-lg shadow-black/30" />
    {withText && (
      <div className="flex flex-col">
        <span className="text-[19px] font-semibold leading-tight tracking-tight">BrightSide</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">Atmospheric Intelligence</span>
      </div>
    )}
  </div>
);

export default Logo;
