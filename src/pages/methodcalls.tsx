import React, { useState } from 'react';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

import Layout from '../components/Layout';
import useLocalStorage from '../hooks/useLocalStorage';
import Card from '../components/Card';
import { NavigationItem } from '../components/Navigation';

const MethodCallFrequencyViewer = dynamic(
  () => import('../components/methodcalls/MethodCallFrequencyViewer'),
  { ssr: false }
);

const MethodCallsPage: NextPage = () => {
  const [navigation] = useState<NavigationItem[]>([
    {
      name: 'Method Calls',
      items: [
        { name: 'Overview', href: '#overview' },
        { name: 'Method Frequency Data', href: '#method-data' }
      ]
    }
  ]);

  // Handle dark mode preference
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <Layout
      title="Method Call Frequency"
      navigation={navigation}
      darkMode={darkMode}
      toggleDarkMode={toggleDarkMode}
    >
      <Head>
        <title>Spark Method Call Frequency Viewer</title>
        <meta name="description" content="View method call frequency data from Spark profiler" />
      </Head>

      <div className="space-y-6">
        <Card id="overview" title="About Method Call Frequency Analysis">
          <p className="mb-4">
            The method call frequency analysis tracks how often Java methods are called per server tick.
            This information can help identify performance bottlenecks and excessive method calls that 
            may be causing lag or performance issues.
          </p>
          <p className="mb-4">
            Features:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>Track method invocation frequencies per game tick</li>
            <li>Identify methods called excessively</li>
            <li>Analyze trends over time</li>
            <li>Filter specific methods/packages</li>
          </ul>
          <p>
            Use the <code className="text-sm bg-gray-100 dark:bg-gray-800 p-1 rounded">
            /spark jfrmethods</code> command in-game to collect method call frequency data.
          </p>
        </Card>

        <Card id="method-data" title="Method Call Frequency Data">
          <MethodCallFrequencyViewer />
        </Card>
      </div>
    </Layout>
  );
};

export default MethodCallsPage; 