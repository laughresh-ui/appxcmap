import React, { useEffect, useRef, useState } from 'react';

interface MapViewProps {
  lat: number;
  lng: number;
  onMapReady?: () => void;
}

// Declare AMap globally
declare global {
  interface Window {
    AMap: any;
  }
}

const MapView: React.FC<MapViewProps> = ({ lat, lng, onMapReady }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isAMapLoaded, setIsAMapLoaded] = useState(false);

  // Check for AMap loading
  useEffect(() => {
    // If already loaded
    if (window.AMap && window.AMap.Map) {
      setIsAMapLoaded(true);
      return;
    }

    // Poll for load
    const checkTimer = setInterval(() => {
      if (window.AMap && window.AMap.Map) {
        setIsAMapLoaded(true);
        clearInterval(checkTimer);
      }
    }, 200);

    return () => clearInterval(checkTimer);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isAMapLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      // Initialize AMap
      // Note: AMap uses [lng, lat] order
      const map = new window.AMap.Map(mapContainerRef.current, {
        zoom: 16,
        center: [lng, lat],
        viewMode: '2D', // 2D is lighter and cleaner for this UI style
        mapStyle: 'amap://styles/whitesmoke', // Matches the "Earth" theme
        showLabel: true, // Show POI names
      });

      // Initialize User Marker (Emoji)
      const marker = new window.AMap.Marker({
        position: [lng, lat],
        content: `
          <div style="
            font-size: 32px; 
            line-height: 1; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transform: translate(-50%, -50%);
          ">🏃</div>
        `,
        offset: new window.AMap.Pixel(0, 0), // Centered via CSS transform in content
        anchor: 'center', 
      });

      map.add(marker);

      mapInstanceRef.current = map;
      markerRef.current = marker;

      if (onMapReady) onMapReady();
    } catch (error) {
      console.error("Failed to initialize AMap:", error);
    }

    // Cleanup not strictly necessary for single page app unless component unmounts frequently,
    // but good practice to destroy map instance.
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [isAMapLoaded]); // Run initialization once AMap is loaded

  // Update position when props change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const newPosition = [lng, lat];
      
      // Update Marker
      markerRef.current.setPosition(newPosition);
      
      // Pan Map smoothly
      mapInstanceRef.current.panTo(newPosition);
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-full bg-earth-200">
      {!isAMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center z-10 bg-earth-100 opacity-90">
          <div>
            <h3 className="text-xl font-bold text-earth-800 animate-pulse">地图资源加载中...</h3>
            <p className="text-sm mt-2 text-earth-600">请确保已配置域名白名单</p>
          </div>
        </div>
      )}
      
      {/* Map Container */}
      <div ref={mapContainerRef} id="amap-container" className="w-full h-full z-0" />
      
      {/* Aesthetic Overlay - Top Gradient */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-earth-50/90 to-transparent pointer-events-none z-10" />
      
      {/* Location Info Overlay */}
      <div className="absolute bottom-20 right-4 z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] text-earth-600 font-mono shadow-sm">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
      </div>
    </div>
  );
};

export default MapView;