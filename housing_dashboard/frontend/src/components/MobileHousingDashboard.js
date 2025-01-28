import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, MapPin, DollarSign, Home, X } from 'lucide-react';

function Header() {
  return (
    <div className="w-full h-auto overflow-hidden">
      <img 
        src="/quantnomics.png"
        alt="Quantnomics Header"
        className="w-full max-h-[200px] md:max-h-[300px] object-contain"
      />
    </div>
  );
}

const MobileHousingDashboard = () => {
  const [data, setData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState([]);
  const [outlineColor, setOutlineColor] = useState('#FFD700');
  const [showDropdown, setShowDropdown] = useState(false);

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
            date: new Date(row.date + 'T12:00:00'),
            ratio: parseFloat(row.ratio?.replace('%', '') || 0),
            median_price: parseFloat(row.median_price || 0),
            monthly_payment: parseFloat(row.monthly_payment || 0),
            median_hhi: parseFloat(row.median_hhi || 0),
          }))
          .sort((a, b) => a.date - b.date);

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
      <Header />
      <div className="p-4 md:max-w-6xl md:mx-auto md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="relative">
            <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200 h-16 relative">
              <Search size={24} className="ml-4 text-gray-600 md:w-8 md:h-8" />
              <input
                type="text"
                placeholder="Search locations"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full p-4 bg-transparent focus:outline-none text-base md:text-lg"
              />
              {searchTerm && (
                <X
                  size={24}
                  className="mr-4 text-gray-600 cursor-pointer md:w-8 md:h-8"
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
                      <p className="text-base md:text-lg">{location}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className="bg-gray-100 rounded-xl p-6 flex items-center relative overflow-hidden h-16"
            style={{
              border: `4px solid ${outlineColor}`,
              transition: 'border-color 0.5s ease',
            }}
          >
            <MapPin size={32} className="mr-4 text-gray-600" />
            <div className="flex-1">
              <p className="text-lg md:text-xl truncate font-semibold">{selectedLocation}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 rounded-xl p-6 flex items-center">
              <DollarSign size={48} className="mr-6 text-gray-600" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{currentYear} Median HHI</h3>
                <p className="text-4xl md:text-3xl">
                  ${(Math.round(currentMedianHHI / 1000) * 1000).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-gray-100 rounded-xl p-6 flex items-center">
              <Home size={48} className="mr-6 text-gray-600" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{currentYear} Median List Price</h3>
                <p className="text-4xl md:text-3xl">
                  ${(Math.round(currentListingPrice / 1000) * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-gray-100 rounded-xl p-6">
              <div className="text-center">
                <span className="font-bold text-gray-800 text-4xl md:text-5xl">
                  {score}
                </span>
                <span className="font-bold text-gray-500 text-2xl md:text-3xl">
                  {' '}/ 10
                </span>
                <p className="text-gray-600 mt-2 text-xl md:text-lg">
                  {score >= 9 ? 'Highly Affordable' :
                   score >= 7 ? 'Affordable' :
                   score >= 5 ? 'Somewhat Affordable' :
                   score >= 3 ? 'Low Affordability' :
                   'Very Low Affordability'}
                </p>
              </div>

              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full ${getScoreColor(score)} transition-all duration-500`}
                    style={{ width: `${(score / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredData.length > 0 && (
          <p className="text-center my-6 text-xl md:text-2xl text-gray-700">
            In <span className="font-bold">{selectedLocation}</span>'s Metro Area, a typical family buying a typical home would have to spend{' '}
            <span className="font-bold" style={{ color: getLineColor() }}>
              {filteredData[filteredData.length - 1].ratio.toFixed(1)}%
            </span>{' '}
            of their monthly income on the mortgage.
          </p>
        )}

        <div className="mt-8 w-full mx-auto max-w-6xl h-[500px] md:h-[600px] bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ left: 80, right: 50, top: 40, bottom: 60 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#f3f4f6" 
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#374151"
                tick={{ fill: '#374151', fontSize: 12, fontFamily: 'system-ui' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.getFullYear();
                }}
                padding={{ left: 0, right: 0 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                stroke="#374151"
                tick={{ 
                  fill: '#374151', 
                  fontSize: 12,
                  fontFamily: 'system-ui',
                  dx: -10
                }}
                label={{
                  value: 'Share of Monthly Income (%)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#374151',
                  fontSize: 14,
                  fontFamily: 'system-ui',
                  dx: -50,
                  dy: 120
                }}
                domain={affordabilityRange}
                tickCount={6}
                tickFormatter={(value) => value.toFixed(0)}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: 12,
                  fontFamily: 'system-ui',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  padding: '8px 12px'
                }}
                labelStyle={{ 
                  color: '#374151',
                  fontWeight: 600,
                  marginBottom: '4px'
                }}
                formatter={(value) => [`${value.toFixed(1)}%`, 'Income Share']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('en-US', { 
                    year: 'numeric',
                    month: 'long'
                  });
                }}
              />
              <Line
                type="monotone"
                dataKey="ratio"
                stroke={getLineColor()}
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: getLineColor(),
                  stroke: '#fff',
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-right space-y-1">
          <p className="text-sm md:text-base text-gray-500 italic">
            * Excludes property taxes, insurance, and other housing costs
          </p>
          <p className="text-sm md:text-base text-gray-500">
            Source: FRED, US Census Bureau
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileHousingDashboard;
