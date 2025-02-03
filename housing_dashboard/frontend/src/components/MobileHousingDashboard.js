import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Cell, Bar, ReferenceLine } from 'recharts';
import { Search, MapPin, DollarSign, Home, X } from 'lucide-react';
import _ from 'lodash';

const AffordabilityDistribution = ({ data }) => {
  // Group data by year and location to get the latest data point for each location in each year
  const yearlyData = data.reduce((acc, curr) => {
    const year = curr.year;
    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][curr.location] || new Date(curr.date) > new Date(acc[year][curr.location].date)) {
      acc[year][curr.location] = curr;
    }
    return acc;
  }, {});

  // Convert the grouped data back to array format for each year
  const processedData = Object.entries(yearlyData).map(([year, locations]) => 
    Object.values(locations).map(item => ({
      ...item,
      year: parseInt(year)
    }))
  ).flat();

  const availableYears = [...new Set(processedData.map(item => item.year))].sort((a, b) => b - a);
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || null);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [data, selectedYear, availableYears]);

  const filteredData = data.filter(item => item.year === selectedYear);
  const allRatios = filteredData.map(item => item.ratio);
  
  // Histogram calculations
  const bins = 30;
  const minRatio = allRatios.length ? Math.floor(Math.min(...allRatios)) : 0;
  const maxRatio = allRatios.length ? Math.ceil(Math.max(...allRatios)) : 30;
  const binWidth = (maxRatio - minRatio) / bins;

  const totalMetros = filteredData.length;
  const affordableMetros = filteredData.filter(item => item.ratio <= 20).length;
  const affordablePercentage = totalMetros > 0 
    ? ((affordableMetros / totalMetros) * 100).toFixed(1)
    : '0.0';

  const histogramData = _.range(bins).map(i => {
    const binStart = minRatio + (i * binWidth);
    const binEnd = binStart + binWidth;
    const count = allRatios.filter(ratio => ratio >= binStart && ratio < binEnd).length;
    return {
      binStart,
      binEnd,
      count,
      label: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
      midpoint: (binStart + binEnd) / 2
    };
  });

  const getBarColor = ratio => {
    if (ratio <= 10) return '#16a34a';
    if (ratio <= 15) return '#22c55e';
    if (ratio <= 20) return '#eab308';
    if (ratio <= 25) return '#f97316';
    return '#dc2626';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 shadow-lg border border-gray-100 rounded-lg">
          <p className="text-gray-600">
            <span className="font-medium">{data.count}</span> metro areas with{' '}
            <span className="font-medium">{data.binStart.toFixed(1)}% - {data.binEnd.toFixed(1)}%</span>
            {' '}ratio
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-8 w-full mx-auto max-w-6xl bg-white rounded-lg border border-gray-100 shadow-sm">
      {availableYears.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Loading year data...
        </div>
      ) : (
        <>
          <div className="px-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xl md:text-2xl text-gray-700 text-center md:text-left">
              In {selectedYear}, <span className="font-bold">{affordablePercentage}%</span> of metro areas had{' '}
              <span className="font-bold" style={{ color: '#eab308' }}>somewhat affordable</span> or better housing costs, 
              requiring 20% or less of household income.
            </p>
            <select 
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="p-2 border rounded-lg bg-white shadow-sm text-gray-700 min-w-[120px]"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="h-[500px] md:h-[600px] p-8 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={histogramData}
                margin={{ left: 80, right: 50, top: 40, bottom: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="2 2" 
                  stroke="#e5e7eb" 
                  vertical={false}
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="label"
                  stroke="#374151"
                  tick={{ 
                    fill: '#1f2937', 
                    fontSize: 12,
                    fontFamily: 'system-ui',
                    fontWeight: 500 
                  }}
                  interval={2}
                  padding={{ left: 0, right: 0 }}
                  axisLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  tickLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                />
                <YAxis
                  stroke="#374151"
                  tick={{ 
                    fill: '#1f2937', 
                    fontSize: 12,
                    fontFamily: 'system-ui',
                    fontWeight: 500,
                    dx: -10
                  }}
                  label={{
                    value: 'Number of Metro Areas',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#1f2937',
                    fontSize: 13,
                    fontFamily: 'system-ui',
                    fontWeight: 500,
                    dx: -50,
                    dy: 120
                  }}
                  axisLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  tickLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                >
                  {histogramData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry.midpoint)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="px-8 pb-8 flex flex-wrap gap-4 justify-center">
            {[
              { label: 'Highly Affordable (≤10%)', color: '#16a34a' },
              { label: 'Affordable (10-15%)', color: '#22c55e' },
              { label: 'Somewhat Affordable (15-20%)', color: '#eab308' },
              { label: 'Low Affordability (20-25%)', color: '#f97316' },
              { label: 'Very Low Affordability (>25%)', color: '#dc2626' }
            ].map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-sm mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className={`w-full sticky top-0 bg-white z-10 transition-all duration-300 ${
        isScrolled ? 'h-16' : 'h-20'
      }`}>
        <img 
          src="/quantnomics.png"
          alt="Quantnomics Header"
          className="w-full h-full object-contain"
        />
        <div className={`w-full h-px bg-gray-200 transition-all duration-300 ${
          isScrolled ? 'my-2' : 'my-4'
        }`}></div>
      </div>
      
      <div className="text-center py-8 px-4">
        <p className="text-base md:text-base text-gray-500 mb-4"></p>
        <h1 className="text-4xl md:text-7xl text-gray-800 font-serif whitespace-nowrap">
          Can <span className="font-extrabold italic">YOU</span> Afford It?
        </h1>
        <h2 className="text-4xl md:text-7xl text-gray-800 font-serif mt-4">
          Housing Costs by City
        </h2>

        {/* Author and LinkedIn section */}
        <div className="mt-8 mb-1">
          <div className="flex items-center justify-center gap-4">
            <p className="text-base text-gray-600">Jeremy Rindal</p>
            <a 
              href="https://www.linkedin.com/in/jeremy-r-a11312193/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:text-blue-800 text-base inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              Follow Me!
            </a>
          </div>
        </div>
        
        {/* Fixed  blurb section */}
        <div className="pt-8 pt-4">
          <div className="max-w-5xl mx-auto px-4">
            <div className="border-t border-b border-gray-200 py-6">
              <p className="text-xl md:text-xl text-gray-600 leading-relaxed font-serif text-center">
                The American Dream has drifted further and further out of reach for most Americans. Here's a reality check—cutting out that daily Starbucks ☕️ won't make up the difference between your income and today's housing costs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const MobileHousingDashboard = () => {
  const [data, setData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState([]);
  const [outlineColor, setOutlineColor] = useState('#492e90');
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
      setOutlineColor((prevColor) => (prevColor === '#492e90' ? '#000000' : '#492e90'));
    }, 1000);

    return () => clearInterval(interval);
 }, []);

  const filteredData = data.filter(item => item.location === selectedLocation);
  const filteredLocations = locations.filter(location =>
    location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableRankingYears = [...new Set(data.map(item => 
    new Date(item.date).getFullYear()
  ))].sort((a, b) => b - a);
  
  const getYearRankings = (year) => {
    const yearData = data.filter(item => new Date(item.date).getFullYear() === year);
    const yearRatios = yearData.reduce((acc, curr) => {
      acc[curr.location] = { ratio: curr.ratio };
      return acc;
    }, {});
  
    const locationsWithRatios = Object.entries(yearRatios).map(([location, { ratio }]) => ({
      location,
      ratio,
    }));
  
    return {
      mostAffordable: [...locationsWithRatios].sort((a, b) => a.ratio - b.ratio).slice(0, 10),
      mostUnaffordable: [...locationsWithRatios].sort((a, b) => b.ratio - a.ratio).slice(0, 10)
    };
  };
  
  const [rankingsYear, setRankingsYear] = useState(null);

  useEffect(() => {
    if (availableRankingYears.length > 0 && !rankingsYear) {
      setRankingsYear(availableRankingYears[0]);
    }
  }, [availableRankingYears, rankingsYear]);
  
  const { mostAffordable, mostUnaffordable } = getYearRankings(rankingsYear);

  const distributionData = data.map(item => ({
    ...item,
    year: new Date(item.date).getFullYear()
  }));

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

  const averageRatio = filteredData.length 
    ? (filteredData.reduce((sum, item) => sum + item.ratio, 0) / filteredData.length).toFixed(1)
    : 0;

  const latestDataPoint = filteredData.length > 0
    ? filteredData[filteredData.length - 1]
    : null;

  const currentYear = latestDataPoint
    ? new Date(latestDataPoint.date).getFullYear()
    : new Date().getFullYear();

  const currentMedianHHI = latestDataPoint?.median_hhi || 0;
  const currentListingPrice = latestDataPoint?.median_price || 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      if (value === null) return null;
      
      const date = new Date(payload[0].payload.date);
      return (
        <div className="bg-white p-4 shadow-lg border border-gray-100 rounded-lg">
          <p className="font-semibold text-gray-800 mb-2">
            {date.getFullYear()}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">{value.toFixed(1)}%</span> of income
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />
      <div className="p-4 md:max-w-6xl md:mx-auto md:px-8 relative">
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
                      <p className="text-base md:text-lg text-center">{location}</p>
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
            <MapPin size={32} className="shrink-0 text-gray-600" />
            <div className="flex-1 flex justify-center items-center px-4">
              <p className="text-lg md:text-xl truncate font-semibold">{selectedLocation}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 rounded-xl p-6 flex flex-col items-center text-center">
              <DollarSign size={48} className="mb-4 text-gray-600" />
              <div>
                <h3 className="text-lg font-semibold mb-2">{currentYear} Median HHI</h3>
                <p className="text-4xl md:text-3xl">
                  ${(Math.round(currentMedianHHI / 1000) * 1000).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-gray-100 rounded-xl p-6 flex flex-col items-center text-center">
              <Home size={48} className="mb-4 text-gray-600" />
              <div>
                <h3 className="text-lg font-semibold mb-2">{currentYear} Median List Price</h3>
                <p className="text-4xl md:text-3xl">
                  ${(Math.round(currentListingPrice / 1000) * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-gray-100 rounded-xl p-6 text-center h-full flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Affordability Score</h3>
                <span className="font-bold text-gray-800 text-4xl md:text-5xl">
                  {score}
                </span>
                <span className="font-bold text-gray-500 text-2xl md:text-3xl">
                  {' '}/ 10
                </span>
                <p className="text-gray-800 font-bold">
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
            In <span className="font-bold">{selectedLocation}</span>'s metro area, a typical family buying a typical home would have to spend{' '}
            <span className="font-bold" style={{ color: getLineColor() }}>
              {filteredData[filteredData.length - 1].ratio.toFixed(1)}%
            </span>{' '}
            of their gross monthly income on the mortgage.
          </p>
        )}

        <div className="mt-8 w-full mx-auto max-w-6xl h-[500px] md:h-[600px] bg-white p-8 rounded-lg border border-gray-100 shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ left: 30, right: 50, top: 20, bottom: 20 }}
            >
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#e5e7eb" 
                vertical={false}
                strokeWidth={1}
              />
              <XAxis
                dataKey="date"
                stroke="#374151"
                tick={{ 
                  fill: '#1f2937', 
                  fontSize: 12,
                  fontFamily: 'system-ui',
                  fontWeight: 500 
                }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.getFullYear();
                }}
                padding={{ left: 0, right: 0 }}
                axisLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                tickLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
              />
              <YAxis
                stroke="#374151"
                tick={{ 
                  fill: '#1f2937', 
                  fontSize: 12,
                  fontFamily: 'system-ui',
                  fontWeight: 500,
                  dx: -10
                }}
                label={{
                  value: 'Share of Monthly Income (%)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#1f2937',
                  fontSize: 12,
                  fontFamily: 'system-ui',
                  fontWeight: 500,
                  dx: -15,
                  dy: 120
                }}
                domain={affordabilityRange}
                tickCount={6}
                tickFormatter={(value) => value.toFixed(0)}
                axisLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                tickLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
              />
              <Tooltip content={<CustomTooltip />} />
                
                <ReferenceLine 
                    y={parseFloat(averageRatio)} 
                    stroke="#6B7280" 
                    strokeDasharray="3 3"
                    label={{
                        value: `Average (${averageRatio}%)`,
                        position: 'right',
                        style: {
                            fill: '#6B7280',
                            fontStyle: 'italic',
                            fontSize: 12,
                        }
                    }}
                />  
                <Line
                type="monotone"
                dataKey="ratio"
                stroke={getLineColor()}
                strokeWidth={3}
                dot={false}
                activeDot={{ 
                  r: 5, 
                  fill: getLineColor(),
                  stroke: '#fff',
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-right space-y-1 mt-4">
          <p className="text-sm md:text-base text-gray-500 italic">
            * Excludes property taxes, insurance, and other housing costs
          </p>
          <p className="text-sm md:text-base text-gray-500 font-medium">
            Source: FRED, US Census Bureau
          </p>
        </div>

        <div className="mt-12 mb-12 border-t border-b border-gray-200 py-8">
          <div className="max-w-5xl mx-auto px-4">
            <p className="text-xl md:text-xl text-gray-600 leading-relaxed font-serif text-center">
              In {rankingsYear}, here are the metros where your money goes further (yes, there might be a cornfield involved)... and the ones where you'll need to win the lottery first.
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <div className="flex justify-end mb-6">
            <select 
              value={rankingsYear}
              onChange={(e) => setRankingsYear(Number(e.target.value))}
              className="p-2 border rounded-lg bg-white shadow-sm text-gray-700 min-w-[120px]"
            >
              {availableRankingYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Top 10 Most Affordable</h3>
                <span className="text-gray-600">Share of Income</span>
              </div>
              <div className="space-y-3">
                {mostAffordable.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg">
                    <span className="font-medium">{item.location}</span>
                    <span className="text-gray-600">{item.ratio.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Top 10 Most Unaffordable</h3>
                <span className="text-gray-600">Share of Income</span>
              </div>
              <div className="space-y-3">
                {mostUnaffordable.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg">
                    <span className="font-medium">{item.location}</span>
                    <span className="text-gray-600">{item.ratio.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 mb-12 border-t border-b border-gray-200 py-8">
            <div className="max-w-5xl mx-auto px-4">
              <p className="text-xl md:text-xl text-gray-600 leading-relaxed font-serif text-center">
                Housing affordability varies dramatically across metropolitan areas, from peaceful cornfield-adjacent communities to cities where even tech millionaires feel poor. Let's examine these market extremes to understand the full spectrum of housing costs in America
              </p>
            </div>
          </div>    

          <div className="mt-8">
            <AffordabilityDistribution data={distributionData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHousingDashboard;
