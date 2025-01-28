import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, MapPin, DollarSign, Home, X } from 'lucide-react';

function Header({ isMobile }) {
  return (
    <div className="w-full h-auto overflow-hidden">
      <img 
        src="/quantnomics.png"
        alt="Quantnomics Header"
        className={`w-full ${isMobile ? 'max-h-[400px]' : 'max-h-[200px]'} object-contain`}
      />
    </div>
  );
}

const MobileHousingDashboard = () => {
  const [data, setData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [outlineColor, setOutlineColor] = useState('#FFD700');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('https://quantnomics-deployment-d88ae194be04.herokuapp.com/api/data');
        const text = await response.text();

        const parsedResult = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        if (parsedResult.errors.length) {
          console.error('Parsing errors:', parsedResult.errors);
          return;
        }

        const parsedData = parsedResult.data
          .map(row => ({
            ...row,
            date: new Date(row.date + 'T12:00:00'), // Add noon time to prevent timezone issues
            ratio: parseFloat(row.ratio?.replace('%', '') || 0),
            median_price: parseFloat(row.median_price || 0),
            monthly_payment: parseFloat(row.monthly_payment || 0),
            median_hhi: parseFloat(row.median_hhi || 0),
          }))
          .sort((a, b) => a.date - b.date); // Sort by date ascending

        const uniqueLocations = [...new Set(parsedData.map(item => item.location))];

        setLocations(uniqueLocations);
        setSelectedLocation(uniqueLocations[0] || '');
        setData(parsedData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOutlineColor((prevColor) => (prevColor === '#FFD700' ? '#00BFFF' : '#FFD700'));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredData = data.filter(item => item.location === selectedLocation);
  const filteredLocations = locations.filter(location =>
    location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAffordabilityScore = () => {
    if (filteredData.length === 0) return 1;

    const latestRatio = filteredData[filteredData.length - 1].ratio;
    const baseline = 20;

    const score = 5 + ((baseline - latestRatio) / baseline) * 5;

    return Math.max(1, Math.min(10, Math.round(score)));
  };

  const getAffordabilityRange = () => {
    if (filteredData.length === 0) return [0, 40];

    const ratios = filteredData.map(item => item.ratio);
    const minRatio = Math.min(...ratios);
    const maxRatio = Math.max(...ratios);

    return [Math.max(0, minRatio - 5), Math.min(40, maxRatio + 5)];
  };

  const affordabilityRange = getAffordabilityRange();
  const score = getAffordabilityScore();

  const getScoreColor = score => {
    if (score >= 9) return 'bg-green-600';
    if (score >= 7) return 'bg-green-500';
    if (score >= 5) return 'bg-yellow-500';
    if (score >= 3) return 'bg-orange-500';
    return 'bg-red-600';
  };

  const getLineColor = () => {
    if (score >= 9) return '#16a34a';
    if (score >= 7) return '#22c55e';
    if (score >= 5) return '#eab308';
    if (score >= 3) return '#f97316';
    return '#dc2626';
  };

  const Section = ({ title, isExpanded, children }) => (
    <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div
        className={`w-full p-4 text-gray-800 bg-gray-100 ${isMobile ? 'text-2xl' : 'text-xl'}`}
      >
        <span className="font-bold">{title}</span>
      </div>
      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  );

  const latestDataPoint = filteredData.length > 0
    ? filteredData[filteredData.length - 1]
    : null;

  const currentYear = latestDataPoint
    ? new Date(latestDataPoint.date).getFullYear()
    : new Date().getFullYear();

  const currentMedianHHI = latestDataPoint?.median_hhi || 0;
  const currentListingPrice = latestDataPoint?.median_price || 0;

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header isMobile={isMobile} />
      <div className="p-4">
        <div className="relative mb-6">
          <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200 h-16 relative">
            <Search size={isMobile ? 48 : 24} className="ml-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search locations"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className={`w-full p-4 bg-transparent focus:outline-none ${isMobile ? 'text-3xl' : 'text-base'}`}
            />
            {searchTerm && (
              <X
                size={isMobile ? 48 : 24}
                className="mr-4 text-gray-600 cursor-pointer"
                onClick={() => {
                  setSearchTerm('');
                  setShowDropdown(false);
                }}
              />
            )}
            {showDropdown && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                {filteredLocations.map((location, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSelectedLocation(location);
                      setSearchTerm(location);
                      setShowDropdown(false);
                    }}
                  >
                    <p className={`${isMobile ? 'text-3xl' : 'text-base'}`}>{location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div
            className="bg-gray-100 rounded-lg p-6 flex items-center relative overflow-hidden"
            style={{
              border: `4px solid ${outlineColor}`,
              transition: 'border-color 0.5s ease',
            }}
          >
            <MapPin size={isMobile ? 64 : 48} className="mr-6 text-gray-600" />
            <div>
              <h3 className="font-semibold text-lg">Current Location</h3>
              <p className={`${isMobile ? 'text-5xl' : 'text-2xl'}`}>{selectedLocation}</p>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-6 flex items-center">
            <DollarSign size={isMobile ? 64 : 48} className="mr-6 text-gray-600" />
            <div>
              <h3 className="font-semibold text-lg">{currentYear} Median HHI</h3>
              <p className={`${isMobile ? 'text-5xl' : 'text-2xl'}`}>
                ${(Math.round(currentMedianHHI / 1000) * 1000).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-6 flex items-center">
            <Home size={isMobile ? 64 : 48} className="mr-6 text-gray-600" />
            <div>
              <h3 className="font-semibold text-lg">{currentYear} Median Price</h3>
              <p className={`${isMobile ? 'text-5xl' : 'text-2xl'}`}>
                ${(Math.round(currentListingPrice / 1000) * 1000).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <span className={`font-bold text-gray-800 ${isMobile ? 'text-8xl' : 'text-4xl'}`}>
              {score}
            </span>
            <span className={`font-bold text-gray-500 ${isMobile ? 'text-6xl' : 'text-2xl'}`}>
              {' '}/ 10
            </span>
            <p className={`text-gray-600 mt-4 ${isMobile ? 'text-4xl' : 'text-xl'}`}>
              {score >= 9 ? 'Highly Affordable' :
               score >= 7 ? 'Affordable' :
               score >= 5 ? 'Somewhat Affordable' :
               score >= 3 ? 'Low Affordability' :
               'Very Low Affordability'}
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className={`h-full ${getScoreColor(score)} transition-all duration-500`}
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {filteredData.length > 0 && (
          <p className="text-center mt-8 mb-4 text-xl text-gray-700">
            In <span className="font-bold">{selectedLocation}</span>, a typical family buying a typical home would spend{' '}
            <span className="font-bold" style={{ color: getLineColor() }}>
              {filteredData[filteredData.length - 1].ratio.toFixed(1)}%
            </span>{' '}
            of their monthly income on the mortgage
          </p>
        )}

        <div className={`mt-6 w-full ${isMobile ? 'h-[800px]' : 'h-[400px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ left: 100, right: 20, top: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#000"
                tick={{ fill: '#000', fontSize: isMobile ? 28 : 20 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.getFullYear();
                }}
                padding={{ left: 0, right: 0 }}
              />
              <YAxis
                stroke="#000"
                tick={{ fill: '#000', fontSize: isMobile ? 28 : 20 }}
                label={{
                  value: 'Mortgage Cost Burden (%)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#000',
                  fontSize: isMobile ? 28 : 20,
                  dx: -20,
                  dy: isMobile ? 250 : 150
                }}
                domain={affordabilityRange}
                tickCount={5}
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: isMobile ? 20 : 12 }}
                labelStyle={{ color: '#000' }}
              />
              <Line
                type="monotone"
                dataKey="ratio"
                stroke={getLineColor()}
                strokeWidth={4}
                dot={{ fill: getLineColor(), r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-right space-y-1">
          <p className={`${isMobile ? 'text-2xl' : 'text-sm'} text-gray-500 italic`}>
            * Excludes property taxes, insurance, and other housing costs
          </p>
          <p className={`${isMobile ? 'text-2xl' : 'text-sm'} text-gray-500`}>
            Source: FRED, US Census Bureau
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileHousingDashboard;
