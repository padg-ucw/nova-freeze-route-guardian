import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface MapRef {
  updateRoute: (routeData: any) => void;
}

interface MapComponentProps {
  onRouteDetailsUpdate?: (details: { distance: number; duration: number }) => void;
}

const MapComponent = forwardRef<MapRef, MapComponentProps>(({ onRouteDetailsUpdate }, ref) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routingControlRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const animationRef = useRef(null);
  const currentRouteCoordinatesRef = useRef([]);

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

  const drawRoute = async (routeData) => {
    if (!mapRef.current) return;

    // Clear existing routing control and vehicle marker
    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
    }
    if (vehicleMarkerRef.current) {
      mapRef.current.removeLayer(vehicleMarkerRef.current);
    }
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    try {
      // Determine route color based on weather
      const routeColor = routeData.weather === 'sunny' ? '#22c55e' : '#ef4444';

      // Create routing control with OSRM
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(routeData.start[0], routeData.start[1]),
          L.latLng(routeData.end[0], routeData.end[1])
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving'
        }),
        lineOptions: {
          styles: [{ color: routeColor, weight: 6, opacity: 0.8 }]
        },
        createMarker: function(i, waypoint, n) {
          const isStart = i === 0;
          const isEnd = i === n - 1;
          
          if (isStart) {
            return L.marker(waypoint.latLng, {
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
            }).bindTooltip(`Start: ${routeData.startName}`, {
              permanent: false,
              direction: 'top'
            });
          } else if (isEnd) {
            return L.marker(waypoint.latLng, {
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
            }).bindTooltip(`End: ${routeData.endName}`, {
              permanent: false,
              direction: 'top'
            });
          }
          return null;
        },
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false // Hide the instruction panel
      }).addTo(mapRef.current);

      // Listen for route found event to start animation
      routingControlRef.current.on('routesfound', function(e) {
        const routes = e.routes;
        const route = routes[0];
        
        if (route && route.coordinates) {
          // Store route coordinates for animation
          currentRouteCoordinatesRef.current = route.coordinates;
          
          // Pass route details to parent component
          if (onRouteDetailsUpdate && route.summary) {
            onRouteDetailsUpdate({
              distance: route.summary.totalDistance,
              duration: route.summary.totalTime
            });
          }
          
          // Create and animate vehicle marker
          vehicleMarkerRef.current = L.marker(route.coordinates[0], {
            icon: createTruckIcon()
          }).addTo(mapRef.current);

          // Animate vehicle along route
          let currentSegment = 0;
          animationRef.current = setInterval(() => {
            if (currentSegment < route.coordinates.length - 1) {
              currentSegment++;
              if (vehicleMarkerRef.current) {
                vehicleMarkerRef.current.setLatLng(route.coordinates[currentSegment]);
              }
            } else {
              // Restart animation
              currentSegment = 0;
              if (vehicleMarkerRef.current) {
                vehicleMarkerRef.current.setLatLng(route.coordinates[0]);
              }
            }
          }, 150);
        }
      });

      console.log('OSRM route initialized successfully:', routeData);
      
    } catch (error) {
      console.error('Error drawing OSRM route:', error);
    }
  };

  return (
    <div className="relative">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[600px] rounded-lg"
        role="application"
        aria-label="Interactive map showing delivery routes across British Columbia"
      />
      <div className="absolute top-4 left-4 bg-green-100 border border-green-400 text-green-800 px-3 py-2 rounded-md text-sm">
        🛣️ Powered by OSRM - Real road routing with OpenStreetMap
      </div>
    </div>
  );
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;
