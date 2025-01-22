import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <ul className="flex justify-around">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/object-detection">Object Detection</Link></li>
        <li><Link to="/text-reader">Document Reader</Link></li>
        <li><Link to="/voice-assistant">AI Assistant</Link></li>
        <li><Link to="/navigation-assistant">Navigation Assistant</Link></li>
      </ul>
    </nav>
  );
};

export default Navigation;