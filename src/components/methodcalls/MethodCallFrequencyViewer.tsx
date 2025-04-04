import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define data interfaces based on protobuf schema
interface TopMethod {
  method_name: string;
  avg_calls_per_tick: number;
  max_calls: number;
  total_calls: number;
}

interface SummaryStatistics {
  unique_method_count: number;
  top_methods: TopMethod[];
  avg_calls_per_tick: number;
}

interface SamplingMetadata {
  sampling_rate_ms: number;
  excessive_call_threshold: number;
  method_filters: string[];
}

interface MethodCallFrequencyData {
  tick: number;
  timestamp: number;
  method_counts: { [key: string]: number };
  method_trends: { [key: string]: number };
  tick_duration_ms: number;
  is_problem_tick: boolean;
}

interface MethodCallFrequencyReport {
  server_name: string;
  server_version: string;
  ticks: MethodCallFrequencyData[];
  metadata: SamplingMetadata;
  summary: SummaryStatistics;
}

const MethodCallFrequencyViewer: React.FC = () => {
  const [report, setReport] = useState<MethodCallFrequencyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [filterText, setFilterText] = useState<string>('');

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/json': ['.json'],
      'application/octet-stream': ['.bin', '.data'],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      setLoading(true);
      setError(null);
      
      try {
        // For simplicity, assume JSON format for now
        // In a real implementation, we would handle binary protobuf format too
        const text = await file.text();
        const data = JSON.parse(text);
        setReport(data);
      } catch (error) {
        console.error('Error processing file:', error);
        setError('Failed to process the file. Please ensure it is a valid method call frequency export.');
      } finally {
        setLoading(false);
      }
    }
  });

  // Generate chart data for selected method
  const getChartData = () => {
    if (!report || !selectedMethod) return null;

    const labels = report.ticks.map(tick => `Tick ${tick.tick}`);
    const data = report.ticks.map(tick => tick.method_counts[selectedMethod] || 0);

    return {
      labels,
      datasets: [
        {
          label: `Calls per tick for ${selectedMethod}`,
          data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        }
      ]
    };
  };

  // Get filtered methods list
  const getFilteredMethods = () => {
    if (!report) return [];

    const allMethods = Object.keys(
      report.ticks.reduce((acc, tick) => {
        Object.keys(tick.method_counts).forEach(method => {
          acc[method] = true;
        });
        return acc;
      }, {} as Record<string, boolean>)
    );

    if (!filterText) return allMethods;

    return allMethods.filter(method => 
      method.toLowerCase().includes(filterText.toLowerCase())
    );
  };

  const filteredMethods = getFilteredMethods();
  const chartData = getChartData();

  return (
    <div className="space-y-6">
      {!report ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}`}
        >
          <input {...getInputProps()} />
          {loading ? (
            <p>Processing file...</p>
          ) : (
            <>
              <p className="mb-2">Drag and drop a method call frequency report file here, or click to select</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Accepts JSON or binary data files exported from the Spark profiler
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">Server Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Server:</span> {report.server_name}</p>
                <p><span className="font-medium">Version:</span> {report.server_version}</p>
              </div>
              <div>
                <p><span className="font-medium">Sampling Rate:</span> {report.metadata.sampling_rate_ms}ms</p>
                <p><span className="font-medium">Ticks Analyzed:</span> {report.ticks.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">Summary Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Unique Methods:</span> {report.summary.unique_method_count}</p>
                <p><span className="font-medium">Avg. Calls Per Tick:</span> {report.summary.avg_calls_per_tick.toFixed(2)}</p>
              </div>
              <div>
                <p><span className="font-medium">Threshold:</span> {report.metadata.excessive_call_threshold} calls</p>
                <p><span className="font-medium">Method Filters:</span> {report.metadata.method_filters.length > 0 
                  ? report.metadata.method_filters.join(', ') 
                  : 'None'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-4">Top Methods by Call Frequency</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Method</th>
                    <th className="px-4 py-2 text-right">Avg Calls/Tick</th>
                    <th className="px-4 py-2 text-right">Max Calls</th>
                    <th className="px-4 py-2 text-right">Total Calls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {report.summary.top_methods.map((method) => (
                    <tr 
                      key={method.method_name}
                      className="hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => setSelectedMethod(method.method_name)}
                    >
                      <td className="px-4 py-2 font-mono text-xs truncate max-w-md">{method.method_name}</td>
                      <td className="px-4 py-2 text-right">{method.avg_calls_per_tick.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{method.max_calls}</td>
                      <td className="px-4 py-2 text-right">{method.total_calls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium">Method Details</h3>
              <input
                type="text"
                placeholder="Filter methods..."
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md md:col-span-1 h-80 overflow-y-auto">
                {filteredMethods.length > 0 ? (
                  <ul className="space-y-1">
                    {filteredMethods.map((method) => (
                      <li 
                        key={method} 
                        className={`py-1 px-2 cursor-pointer rounded font-mono text-xs truncate
                          ${selectedMethod === method ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        onClick={() => setSelectedMethod(method)}
                      >
                        {method}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No methods match the filter</p>
                )}
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md md:col-span-2">
                {selectedMethod ? (
                  <>
                    <h4 className="font-medium mb-4">Call Frequency over Time</h4>
                    {chartData && (
                      <div className="h-64">
                        <Line 
                          data={chartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }} 
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">Select a method to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default MethodCallFrequencyViewer; 