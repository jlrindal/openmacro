import React from 'react';
import { Helmet } from 'react-helmet';
import MobileHousingDashboard from './components/MobileHousingDashboard';

function App() {
  return (
    <>
      <Helmet>
        <title>Housing Affordability Dashboard - Can You Afford It?</title>
        <meta name="description" content="Explore housing affordability across US metro areas. Compare housing costs, income ratios, and affordability scores to understand market trends." />
        <link rel="icon" href="/favicon.png" />
      </Helmet>
      <MobileHousingDashboard />
    </>
  );
}

export default App;
