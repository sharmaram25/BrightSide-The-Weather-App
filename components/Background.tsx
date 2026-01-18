import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BackgroundProps {
  weatherCode: number | null;
  timezone: number;
}

type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

const Background: React.FC<BackgroundProps> = ({ weatherCode, timezone }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { timeOfDay, hour } = useMemo(() => {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cityTime = new Date(utcMs + (timezone * 1000));
    const h = cityTime.getHours();

    let t: TimeOfDay = 'night';
    if (h >= 5 && h < 8) t = 'dawn';
    else if (h >= 8 && h < 17) t = 'day';
    else if (h >= 17 && h < 20) t = 'dusk';
    else t = 'night';

    return { timeOfDay: t, hour: h };
  }, [timezone]);

  const getGradient = () => {
    if (weatherCode) {
      if (weatherCode >= 200 && weatherCode < 300) return 'linear-gradient(to bottom, #141E30, #243B55)';
      if (weatherCode >= 300 && weatherCode < 600) return 'linear-gradient(to bottom, #203a43, #2c5364)';
      if (weatherCode >= 600 && weatherCode < 700) return 'linear-gradient(to bottom, #83a4d4, #b6fbff)';
      if (weatherCode >= 700 && weatherCode < 800) return 'linear-gradient(to bottom, #3E5151, #DECBA4)';
      if (weatherCode > 800) {
        if (timeOfDay === 'night') return 'linear-gradient(to bottom, #232526, #414345)';
        return 'linear-gradient(to bottom, #5D4157, #A8CABA)'; 
      }
    }

    switch (timeOfDay) {
      case 'dawn': return 'linear-gradient(to bottom, #f46b45, #eea849)';
      case 'day': return 'linear-gradient(to bottom, #2980b9, #6dd5fa, #ffffff)';
      case 'dusk': return 'linear-gradient(to bottom, #2b5876, #4e4376)';
      case 'night': return 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364)';
      default: return 'linear-gradient(to bottom, #0f2027, #2c5364)';
    }
  };

  const bgGradient = getGradient();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: any[] = [];
    let clouds: any[] = [];
    let stars: any[] = [];

    const isRaining = weatherCode && weatherCode >= 300 && weatherCode < 600;
    const isSnowing = weatherCode && weatherCode >= 600 && weatherCode < 700;
    const isCloudy = weatherCode && weatherCode > 800;
    const isClear = weatherCode === 800;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initElements();
    };

    const initElements = () => {
      particles = [];
      clouds = [];
      stars = [];

      if (isRaining || isSnowing) {
        const count = isRaining ? 300 : 150;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * (isRaining ? 15 : 2) + 2,
            length: Math.random() * 20 + 5,
            size: Math.random() * 2 + 1
          });
        }
      }

      if (isCloudy || isRaining || isSnowing) {
         const cloudCount = 8;
         for(let i=0; i<cloudCount; i++) {
            clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height * 0.4),
                r: Math.random() * 100 + 50,
                s: Math.random() * 0.2 + 0.1,
                o: Math.random() * 0.3 + 0.1
            });
         }
      }

      if ((timeOfDay === 'night' || timeOfDay === 'dusk') && (isClear || (weatherCode && weatherCode < 803))) {
          for(let i=0; i<150; i++) {
              stars.push({
                  x: Math.random() * canvas.width,
                  y: Math.random() * canvas.height,
                  s: Math.random() * 2,
                  a: Math.random()
              });
          }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (stars.length > 0) {
          ctx.fillStyle = 'white';
          stars.forEach(star => {
              ctx.globalAlpha = Math.abs(Math.sin(Date.now() * 0.001 + star.x)) * star.a;
              ctx.beginPath();
              ctx.arc(star.x, star.y, star.s, 0, Math.PI*2);
              ctx.fill();
          });
          ctx.globalAlpha = 1;
      }

      if (clouds.length > 0) {
        clouds.forEach(c => {
            const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
            grad.addColorStop(0, `rgba(255,255,255,${c.o})`);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
            ctx.fill();
            c.x += c.s;
            if(c.x - c.r > canvas.width) c.x = -c.r;
        });
      }

      if (particles.length > 0) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        particles.forEach(p => {
           if(isRaining) {
               ctx.lineWidth = 1;
               ctx.beginPath();
               ctx.moveTo(p.x, p.y);
               ctx.lineTo(p.x, p.y + p.length);
               ctx.stroke();
               p.y += p.speed;
           } else {
               ctx.beginPath();
               ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
               ctx.fill();
               p.y += p.speed;
               p.x += Math.sin(p.y * 0.01) * 0.5;
           }

           if (p.y > canvas.height) {
               p.y = -20;
               p.x = Math.random() * canvas.width;
           }
        });
      }

      animationId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [weatherCode, timeOfDay]);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-900 transition-all duration-1000 ease-in-out">
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={false}
        animate={{ background: bgGradient }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <AnimatePresence>
        {(timeOfDay === 'day' || timeOfDay === 'dawn') && !weatherCode?.toString().startsWith('2') && (
           <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ 
                y: timeOfDay === 'dawn' ? 100 : -50, 
                x: timeOfDay === 'dawn' ? -100 : 50,
                opacity: 1 
            }}
            transition={{ duration: 4, ease: "easeOut" }}
            className="absolute top-20 right-20 w-64 h-64 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 blur-[80px] opacity-60 pointer-events-none mix-blend-screen" 
           />
        )}
        {(timeOfDay === 'night' || timeOfDay === 'dusk') && (
           <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 3 }}
            className="absolute top-32 left-20 w-40 h-40 rounded-full bg-blue-100 blur-[60px] opacity-20 pointer-events-none mix-blend-overlay" 
           />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Background;