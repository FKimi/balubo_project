import React from 'react';
import OgpTester from '../components/OgpTester';

const OgpTestPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Netlify Edge Functions OGP取得テスト</h1>
      <OgpTester />
    </div>
  );
};

export default OgpTestPage;
