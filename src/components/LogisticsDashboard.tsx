
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MapComponent from './MapComponent';
import { Truck, AlertTriangle, Snowflake, CloudRain } from 'lucide-react';

const BC_LOCATIONS = [
  { name: 'Downtown Vancouver', coords: [49.2827, -123.1207] },
  { name: 'UBC Vancouver', coords: [49.2606, -123.2460] },
  { name: 'Surrey Central Station', coords: [49.1897, -122.8481] },
  { name: 'Richmond Centre', coords: [49.1737, -123.1365] },
  { name: 'Abbotsford International Airport', coords: [49.0252, -122.3606] },
  { name: 'Kelowna General Hospital', coords: [49.8844, -119.4821] },
  { name: 'Kamloops North Station', coords: [50.6745, -120.3273] },
  { name: 'Victoria Harbour', coords: [48.4284, -123.3656] },
  { name: 'Nanaimo Ferry Terminal', coords: [49.1659, -123.9401] },
  { name: 'Prince George Civic Centre', coords: [53.9171, -122.7497] }
];

const WEATHER_CONDITIONS = [
  { value: 'sunny', label: '☀️ Sunny', icon: '☀️' },
  { value: 'rain', label: '🌧️ Rain', icon: '🌧️' },
  { value: 'snow', label: '❄️ Snow', icon: '❄️' }
];

const LogisticsDashboard = () => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [weather, setWeather] = useState('sunny');
  const [route, setRoute] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef();

  const handleGenerateRoute = async () => {
    setError('');
    
    if (!startLocation || !endLocation) {
      setError('Please select both start and end locations.');
      return;
    }
    
    if (startLocation === endLocation) {
      setError('⚠️ Please choose different locations.');
      return;
    }

    setIsLoading(true);
    
    try {
      const start = BC_LOCATIONS.find(loc => loc.name === startLocation);
      const end = BC_LOCATIONS.find(loc => loc.name === endLocation);
      
      if (!start || !end) {
        throw new Error('Invalid location selected');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const routeData = {
        start: start.coords,
        end: end.coords,
        weather,
        startName: start.name,
        endName: end.name
      };
      
      setRoute(routeData);
      
      if (mapRef.current) {
        mapRef.current.updateRoute(routeData);
      }
    } catch (err) {
      console.error('Route generation error:', err);
      setError('⚠️ No valid route found for selected locations.');
    } finally {
      setIsLoading(false);
    }
  };

  const isHighRisk = weather === 'rain' || weather === 'snow';

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Truck className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            NovaFreeze Guardian AI
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          AI-Powered Cold-Chain Logistics Dashboard for British Columbia
        </p>
      </div>

      {/* Controls Panel */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Start Location</label>
            <Select value={startLocation} onValueChange={setStartLocation}>
              <SelectTrigger className="w-full" aria-label="Select start location">
                <SelectValue placeholder="Choose start location" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {BC_LOCATIONS.map((location) => (
                  <SelectItem 
                    key={location.name} 
                    value={location.name}
                    className="hover:bg-blue-50 cursor-pointer"
                  >
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">End Location</label>
            <Select value={endLocation} onValueChange={setEndLocation}>
              <SelectTrigger className="w-full" aria-label="Select end location">
                <SelectValue placeholder="Choose end location" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {BC_LOCATIONS.map((location) => (
                  <SelectItem 
                    key={location.name} 
                    value={location.name}
                    className="hover:bg-blue-50 cursor-pointer"
                  >
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Weather Condition</label>
            <Select value={weather} onValueChange={setWeather}>
              <SelectTrigger className="w-full" aria-label="Select weather condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {WEATHER_CONDITIONS.map((condition) => (
                  <SelectItem 
                    key={condition.value} 
                    value={condition.value}
                    className="hover:bg-blue-50 cursor-pointer"
                  >
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleGenerateRoute} 
            disabled={isLoading}
            className="h-10 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium transition-all duration-200 transform hover:scale-105"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </div>
            ) : (
              'Generate Route'
            )}
          </Button>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50" role="alert">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Risk Alert */}
      {route && isHighRisk && (
        <Alert className="border-red-400 bg-red-100 animate-pulse" role="alert">
          <div className="flex items-center gap-2">
            {weather === 'snow' ? (
              <Snowflake className="h-5 w-5 text-red-600" />
            ) : (
              <CloudRain className="h-5 w-5 text-red-600" />
            )}
            <AlertDescription className="text-red-800 font-semibold text-lg">
              🔴 High Risk: Weather conditions may lead to spoilage or delays.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Map */}
      <Card className="overflow-hidden shadow-xl border-blue-200">
        <MapComponent ref={mapRef} />
      </Card>

      {/* Route Info */}
      {route && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-800">
                  Route: {route.startName} → {route.endName}
                </h3>
                <p className="text-sm text-gray-600">
                  Weather: {WEATHER_CONDITIONS.find(w => w.value === weather)?.label}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isHighRisk 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {isHighRisk ? 'High Risk' : 'Low Risk'}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LogisticsDashboard;
