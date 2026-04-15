'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

const defaultProjects = [
  { title: "Neuro-Robotics Control Arm", role: "Robotics Engineer", desc: "Seeking hardware experts to refine the multi-axis movement for surgical assistance.", stage: "Prototyping" },
  { title: "AI Cardiology Imaging", role: "Data Scientist", desc: "Building a CNN model to detect early-stage arrhythmia from low-res ultrasounds.", stage: "Validation" },
  { title: "Genomic Sequencing App", role: "Software", desc: "Looking for an engineer to build the high-availability cloud architecture.", stage: "Planning" },
  { title: "Remote Telemetry Patch", role: "Hardware", desc: "Embedded systems expert needed to optimize power draw on Bluetooth LE.", stage: "Testing" },
  { title: "AR Anatomy Visualizer", role: "Frontend Dev", desc: "Implementing Three.js visualization for medical student training modules.", stage: "Concept" }
];

const cardBackgrounds = [
  "/assets/mesh_1.png",
  "/assets/mesh_2.png",
  "/assets/mesh_3.png",
  "/assets/mesh_4.png",
  "/assets/mesh_5.png"
];

const ASCII_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789(){}[]<>;:,._-+=!@#$%^&*|\\/\"'`~?";
const generateCode = (width, height) => {
  let text = "";
  for (let i = 0; i < width * height; i++) {
    text += ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
  }
  let out = "";
  for (let i = 0; i < height; i++) {
    out += text.substring(i * width, (i + 1) * width) + "\n";
  }
  return out;
};

export const ScannerCardStream = ({
  initialSpeed = 60,
  direction = -1,
  projects = defaultProjects,
  repeat = 6,
  cardGap = 40,
  friction = 0.95,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  
  const cards = useMemo(() => {
    const totalCards = projects.length * repeat;
    return Array.from({ length: totalCards }, (_, i) => ({
      id: i,
      data: projects[i % projects.length],
      bg: cardBackgrounds[i % cardBackgrounds.length],
      ascii: generateCode(Math.floor(400 / 6.5), Math.floor(250 / 13)),
    }))
  }, [projects, repeat]);

  const cardLineRef = useRef(null);
  const particleCanvasRef = useRef(null);
  const scannerCanvasRef = useRef(null);

  const cardStreamState = useRef({
    position: 0, velocity: initialSpeed, direction: direction, isDragging: false,
    lastMouseX: 0, lastTime: performance.now(), cardLineWidth: (420 + cardGap) * cards.length,
    friction: friction, minVelocity: 30,
  });

  const scannerState = useRef({ isScanning: false });

  // Touch and Mouse Handlers for Dragging
  useEffect(() => {
    const cardLine = cardLineRef.current;
    if (!cardLine) return;

    const handleStart = (e) => {
      cardStreamState.current.isDragging = true;
      cardStreamState.current.lastMouseX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      cardLine.style.cursor = 'grabbing';
      cardStreamState.current.velocity = 0;
    };

    const handleMove = (e) => {
      if (!cardStreamState.current.isDragging) return;
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - cardStreamState.current.lastMouseX;
      
      cardStreamState.current.position += deltaX;
      
      const absDelta = Math.abs(deltaX);
      cardStreamState.current.velocity = absDelta > 60 ? absDelta * 2 : Math.max(absDelta * 5, 20);
      cardStreamState.current.direction = deltaX > 0 ? 1 : -1;
      cardStreamState.current.lastMouseX = clientX;
    };

    const handleEnd = () => {
      cardStreamState.current.isDragging = false;
      cardLine.style.cursor = 'grab';
    };

    const handleWheel = (e) => {
      e.preventDefault();
      cardStreamState.current.position -= e.deltaY;
      cardStreamState.current.direction = e.deltaY > 0 ? -1 : 1;
      cardStreamState.current.velocity = Math.max(80, Math.abs(e.deltaY));
    };

    cardLine.addEventListener("mousedown", handleStart);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    
    cardLine.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);
    
    cardLine.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      cardLine.removeEventListener("mousedown", handleStart);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      cardLine.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      cardLine.removeEventListener("wheel", handleWheel);
    }
  }, []);

  // Rendering Loop completely overhauled
  useEffect(() => {
    const cardLine = cardLineRef.current;
    const particleCanvas = particleCanvasRef.current;
    const scannerCanvas = scannerCanvasRef.current;

    if (!cardLine || !particleCanvas || !scannerCanvas) return;
    let animationFrameId;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, 125, -125, 1, 1000);
    camera.position.z = 100;
    const renderer = new THREE.WebGLRenderer({ canvas: particleCanvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, 250);
    renderer.setClearColor(0x000000, 0);
    
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    const alphas = new Float32Array(particleCount);
    
    const texCanvas = document.createElement("canvas");
    texCanvas.width = 100; texCanvas.height = 100;
    const texCtx = texCanvas.getContext("2d");
    const half = 50;
    const gradient = texCtx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0.025, "#fff");
    gradient.addColorStop(0.1, `hsl(250, 61%, 33%)`);
    gradient.addColorStop(0.25, `hsl(250, 64%, 6%)`);
    gradient.addColorStop(1, "transparent");
    texCtx.fillStyle = gradient;
    texCtx.arc(half, half, half, 0, Math.PI * 2);
    texCtx.fill();
    const texture = new THREE.CanvasTexture(texCanvas);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * window.innerWidth * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 250;
        velocities[i] = Math.random() * 60 + 30;
        alphas[i] = (Math.random() * 8 + 2) / 10;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: { pointTexture: { value: texture } },
      vertexShader: `attribute float alpha; varying float vAlpha; void main() { vAlpha = alpha; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_PointSize = 15.0; gl_Position = projectionMatrix * mvPosition; }`,
      fragmentShader: `uniform sampler2D pointTexture; varying float vAlpha; void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha) * texture2D(pointTexture, gl_PointCoord); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: false,
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    const ctx = scannerCanvas.getContext('2d');
    scannerCanvas.width = window.innerWidth;
    scannerCanvas.height = 300;
    let scannerParticles = [];
    
    const createScannerParticle = () => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 5, y: Math.random() * 300, vx: Math.random() * 1.5 + 0.2, vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 1.0 + 0.4, alpha: Math.random() * 0.6 + 0.4, life: 1.0, decay: Math.random() * 0.03 + 0.01,
    });
    for (let i = 0; i < 400; i++) scannerParticles.push(createScannerParticle());

    const updateCardEffects = () => {
      const scannerX = window.innerWidth / 2;
      const scannerWidth = 10;
      const scannerLeft = scannerX - scannerWidth / 2;
      const scannerRight = scannerX + scannerWidth / 2;
      let anyCardIsScanning = false;
      
      cardLine.querySelectorAll(".card-wrapper").forEach((wrapper) => {
        const rect = wrapper.getBoundingClientRect();
        const normalCard = wrapper.querySelector(".card-normal");
        const asciiCard = wrapper.querySelector(".card-ascii");
        
        if (rect.left < scannerRight && rect.right > scannerLeft) {
          anyCardIsScanning = true;
          const intersectLeft = Math.max(scannerLeft - rect.left, 0);
          const intersectRight = Math.min(scannerRight - rect.left, rect.width);
          
          normalCard.style.setProperty("--clip-right", `${100 - (intersectLeft / rect.width) * 100}%`);
          asciiCard.style.setProperty("--clip-left", `${(intersectRight / rect.width) * 100}%`);
        } else {
          if (rect.right <= scannerLeft) {
            normalCard.style.setProperty("--clip-right", "0%");
            asciiCard.style.setProperty("--clip-left", "100%");
          } else {
            normalCard.style.setProperty("--clip-right", "100%");
            asciiCard.style.setProperty("--clip-left", "0%");
          }
        }
      });
      setIsScanning(anyCardIsScanning);
      scannerState.current.isScanning = anyCardIsScanning;
    };
    
    const animate = (currentTime) => {
      const deltaTime = (currentTime - cardStreamState.current.lastTime) / 1000;
      cardStreamState.current.lastTime = currentTime;
      
      if (!cardStreamState.current.isDragging) {
        if (cardStreamState.current.velocity > cardStreamState.current.minVelocity) {
            cardStreamState.current.velocity *= cardStreamState.current.friction;
        }
        cardStreamState.current.position += cardStreamState.current.velocity * cardStreamState.current.direction * deltaTime;
      }
      
      const { position } = cardStreamState.current;
      
      // INFINITE LOOP MATH:
      // The total width of one "set" of projects
      const singleSetWidth = (420 + cardGap) * projects.length;
      
      // If we scroll too far left, jump back by one set width seamlessly
      if (position <= -singleSetWidth * 2) {
         cardStreamState.current.position += singleSetWidth;
      } 
      // If we scroll too far right, jump forward by one set width seamlessly
      else if (position >= 0) {
         cardStreamState.current.position -= singleSetWidth;
      }
      
      cardLine.style.transform = `translate3d(${cardStreamState.current.position}px, 0, 0)`;
      updateCardEffects();
      
      const time = currentTime * 0.001;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i] * 0.016;
        if (positions[i * 3] > window.innerWidth / 2 + 100) positions[i * 3] = -window.innerWidth / 2 - 100;
        positions[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.5;
        alphas[i] = Math.max(0.1, Math.min(1, alphas[i] + (Math.random() - 0.5) * 0.05));
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.alpha.needsUpdate = true;
      renderer.render(scene, camera);
      
      ctx.clearRect(0, 0, window.innerWidth, 300);
      const targetCount = scannerState.current.isScanning ? 1200 : 400;
      while (scannerParticles.length < targetCount) scannerParticles.push(createScannerParticle());
      while (scannerParticles.length > targetCount) scannerParticles.pop();
      scannerParticles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.life <= 0 || p.x > window.innerWidth) Object.assign(p, createScannerParticle());
        ctx.globalAlpha = p.alpha * p.life; ctx.fillStyle = "rgba(167, 139, 250, 0.8)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    
    return () => { cancelAnimationFrame(animationFrameId); };
  }, [cards, cardGap, friction, projects.length]);

  return (
    <div className="absolute inset-0 w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-background">
      <style>{`
        @keyframes glitch { 0%, 16%, 50%, 100% { opacity: 1; } 15%, 99% { opacity: 0.9; } 49% { opacity: 0.8; } }
        .animate-glitch { animation: glitch 0.1s infinite linear alternate-reverse; }
        
        @keyframes scanPulse {
          0% { opacity: 0.75; transform: scaleY(1); }
          100% { opacity: 1; transform: scaleY(1.05); }
        }
        .animate-scan-pulse {
          animation: scanPulse 1.5s infinite alternate ease-in-out;
        }
        
        /* Ensures nav acts as an overlay without pushing layout */
        .page-navigation-overlay { pointer-events: none; }
        .page-navigation-overlay * { pointer-events: auto; }
      `}</style>

      <canvas ref={particleCanvasRef} className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[250px] z-0 pointer-events-none" />
      <canvas ref={scannerCanvasRef} className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[300px] z-10 pointer-events-none" />
      
      <div
        className={`scanner-line absolute top-1/2 left-1/2 h-[340px] w-[3px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-violet-500 to-transparent rounded-full transition-opacity duration-300 z-20 pointer-events-none animate-scan-pulse ${isScanning ? 'opacity-100' : 'opacity-0'}`}
        style={{ boxShadow: `0 0 15px #a78bfa, 0 0 30px #8b5cf6, 0 0 50px #6366f1` }}
      />

      <div className="absolute top-1/2 left-0 w-full h-[250px] -translate-y-1/2 flex items-center z-10">
        <div ref={cardLineRef} className="flex items-center whitespace-nowrap cursor-grab select-none will-change-transform" style={{ gap: `${cardGap}px` }}>
          {cards.map(card => (
            <div key={card.id} className="card-wrapper relative w-[420px] h-[250px] shrink-0">
              <div 
                className="card-normal card absolute top-0 left-0 w-full h-full rounded-[2rem] overflow-hidden bg-black/90 shadow-2xl flex flex-col justify-between p-8 z-[2] transition-colors border border-white/10"
                style={{ clipPath: 'inset(0 var(--clip-right, 0%) 0 0)' }}
              >
                {/* Physical Authentic Card Background Vector */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                   <img src={card.bg} alt="Card Theme" className="w-full h-full object-cover opacity-90 dark:opacity-70 saturate-150 contrast-125 mix-blend-screen" />
                   <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
                </div>

                <div className="relative z-10 flex justify-between items-start gap-4">
                  <h3 className="font-sans text-[22px] font-bold leading-tight tracking-tight whitespace-normal text-white drop-shadow-md">{card.data.title}</h3>
                  <span className="bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">{card.data.role}</span>
                </div>
                <div className="relative z-10">
                  <p className="text-[14px] text-zinc-300 mb-5 whitespace-normal leading-snug drop-shadow-md font-medium tracking-wide">{card.data.desc}</p>
                  <span className="text-[11px] font-mono bg-white/10 backdrop-blur-md text-white border border-white/10 px-3 py-1.5 rounded-lg font-semibold tracking-wider">{card.data.stage}</span>
                </div>
              </div>
              <div 
                className="card-ascii card absolute top-0 left-0 w-full h-full rounded-[2rem] overflow-hidden bg-transparent border border-violet-500/20 z-[1] backdrop-blur-sm"
                style={{ clipPath: 'inset(0 0 0 var(--clip-left, 0%))' }}
              >
                <pre className="ascii-content absolute top-0 left-0 w-full h-full text-[rgba(167,139,250,0.7)] font-mono text-[11px] leading-[13px] overflow-hidden whitespace-pre m-0 p-0 text-left align-top box-border animate-glitch" style={{ maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.2) 100%)', WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.2) 100%)' }}>
                  {card.ascii}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
