import React from 'react';

export function StarryBackground() {
  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Real image background: Astronaut perspective of Earth from space */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2000&q=80")' }}
      ></div>

      {/* Dark Overlay gradient to ensure text readability */}
      <div className="absolute inset-0 bg-slate-900/40"></div>
      
      {/* Bottom fade out overlay to blend with #f8f9fa background */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[#f8f9fa]"></div>
    </div>
  );
}
