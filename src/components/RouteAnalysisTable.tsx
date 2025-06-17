
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Truck, AlertTriangle, Clock, Route, Snowflake, CloudRain, Sun } from 'lucide-react';

interface RouteData {
  startName: string;
  endName: string;
  weather: string;
  distance?: number;
  duration?: number;
}

interface RouteAnalysisTableProps {
  route: RouteData;
}

const RouteAnalysisTable: React.FC<RouteAnalysisTableProps> = ({ route }) => {
  const isHighRisk = route.weather === 'rain' || route.weather === 'snow';
  
  const getWeatherIcon = () => {
    switch (route.weather) {
      case 'sunny': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'rain': return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'snow': return <Snowflake className="h-4 w-4 text-blue-300" />;
      default: return <Sun className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getWeatherLabel = () => {
    switch (route.weather) {
      case 'sunny': return '☀️ Sunny';
      case 'rain': return '🌧️ Rain';
      case 'snow': return '❄️ Snow';
      default: return '☀️ Sunny';
    }
  };

  const getSuggestedVehicle = () => {
    if (isHighRisk) {
      return 'Heavy-Duty Refrigerated Truck';
    }
    return 'Standard Refrigerated Van';
  };

  const getOptimizationMethod = () => {
    if (isHighRisk) {
      return 'Weather-adapted route (safety priority)';
    }
    return 'Fastest route (time optimized)';
  };

  const getNotes = () => {
    if (route.weather === 'snow') {
      return 'Use snow chains, check tire pressure, reduce speed';
    }
    if (route.weather === 'rain') {
      return 'Monitor road conditions, avoid flooded areas';
    }
    return 'Optimal conditions for delivery';
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Route className="h-5 w-5 text-blue-600" />
          Route Analysis Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-gray-700 w-1/3">Route Name</TableCell>
              <TableCell className="font-semibold">{route.startName} → {route.endName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-gray-700">Weather</TableCell>
              <TableCell className="flex items-center gap-2">
                {getWeatherIcon()}
                {getWeatherLabel()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-gray-700">Total Distance</TableCell>
              <TableCell>
                {route.distance ? `${(route.distance / 1000).toFixed(1)} km` : 'Calculating...'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-gray-700">Estimated Time</TableCell>
              <TableCell className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                {route.duration ? `${Math.round(route.duration / 60)} minutes` : 'Calculating...'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-gray-700">Risk Level</TableCell>
              <TableCell>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  isHighRisk 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isHighRisk ? (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      🔴 High Risk
                    </>
                  ) : (
                    <>
                      <span className="text-green-600">✅</span>
                      🟢 Low Risk
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-gray-700">Suggested Vehicle</TableCell>
              <TableCell className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                {getSuggestedVehicle()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-gray-700">Optimization Method</TableCell>
              <TableCell>{getOptimizationMethod()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-gray-700">Notes</TableCell>
              <TableCell className="text-sm">
                <span className={isHighRisk ? 'text-red-700 font-medium' : 'text-gray-600'}>
                  {getNotes()}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RouteAnalysisTable;
