
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = forwardRef((props, ref) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef([]);
  const vehicleMarkerRef = useRef(null);
  const animationRef = useRef(null);

  useImperativeHandle(ref, () => ({
    updateRoute: (routeData) => {
      drawRoute(routeData);
    }
  }));

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current).setView([49.2827, -123.1207], 10);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  const createTruckIcon = () => {
    return L.divIcon({
      html: `
        <div style="
          width: 32px; 
          height: 32px; 
          background: linear-gradient(45deg, #2563eb, #0891b2);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
          border: 2px solid white;
          animation: pulse 2s infinite;
        ">
          🚚
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        </style>
      `,
      className: 'custom-truck-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const generateRouteCoordinates = (start, end) => {
    // Generate a realistic route with multiple waypoints
    const latDiff = end[0] - start[0];
    const lngDiff = end[1] - start[1];
    const segments = 20;
    const coordinates = [];
    
    for (let i = 0; i <= segments; i++) {
      const progress = i / segments;
      // Add some curve to make it look more realistic
      const curveFactor = Math.sin(progress * Math.PI) * 0.01;
      const lat = start[0] + (latDiff * progress) + (curveFactor * (Math.random() - 0.5));
      const lng = start[1] + (lngDiff * progress) + (curveFactor * (Math.random() - 0.5));
      coordinates.push([lat, lng]);
    }
    
    return coordinates;
  };

  const drawRoute = (routeData) => {
    if (!mapRef.current) return;

    // Clear existing route and markers
    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
    }
    if (vehicleMarkerRef.current) {
      mapRef.current.removeLayer(vehicleMarkerRef.current);
    }
    markersRef.current.forEach(marker => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    // Generate route coordinates
    const routeCoordinates = generateRouteCoordinates(routeData.start, routeData.end);

    // Determine route color based on weather
    const routeColor = routeData.weather === 'sunny' ? '#22c55e' : '#ef4444';
    const routeWeight = 6;

    // Draw route polyline
    routeLayerRef.current = L.polyline(routeCoordinates, {
      color: routeColor,
      weight: routeWeight,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(mapRef.current);

    // Add start marker
    const startMarker = L.marker(routeData.start, {
      icon: L.divIcon({
        html: `<div style="
          background: #22c55e; 
          color: white; 
          border-radius: 50%; 
          width: 24px; 
          height: 24px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">S</div>`,
        className: 'custom-start-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(mapRef.current);
    
    startMarker.bindTooltip(`Start: ${routeData.startName}`, {
      permanent: false,
      direction: 'top'
    });

    // Add end marker
    const endMarker = L.marker(routeData.end, {
      icon: L.divIcon({
        html: `<div style="
          background: #ef4444; 
          color: white; 
          border-radius: 50%; 
          width: 24px; 
          height: 24px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">E</div>`,
        className: 'custom-end-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(mapRef.current);
    
    endMarker.bindTooltip(`End: ${routeData.endName}`, {
      permanent: false,
      direction: 'top'
    });

    markersRef.current = [startMarker, endMarker];

    // Create and animate vehicle marker
    vehicleMarkerRef.current = L.marker(routeCoordinates[0], {
      icon: createTruckIcon()
    }).addTo(mapRef.current);

    // Fit map to route bounds
    mapRef.current.fitBounds(routeLayerRef.current.getBounds(), {
      padding: [50, 50]
    });

    // Animate vehicle along route
    let currentSegment = 0;
    animationRef.current = setInterval(() => {
      if (currentSegment < routeCoordinates.length - 1) {
        currentSegment++;
        if (vehicleMarkerRef.current) {
          vehicleMarkerRef.current.setLatLng(routeCoordinates[currentSegment]);
        }
      } else {
        // Restart animation
        currentSegment = 0;
        if (vehicleMarkerRef.current) {
          vehicleMarkerRef.current.setLatLng(routeCoordinates[0]);
        }
      }
    }, 2000);

    console.log('Route drawn successfully:', routeData);
  };

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-[600px] rounded-lg"
      role="application"
      aria-label="Interactive map showing delivery routes across British Columbia"
    />
  );
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;
