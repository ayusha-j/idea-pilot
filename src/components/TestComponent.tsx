import React from 'react';

export default function TestComponent() {
  return (
    <div className="p-8 m-4">
      <h2 className="text-2xl font-bold mb-4">Tailwind Test Component</h2>
      
      {/* Plain HTML with hardcoded styles to ensure something shows up */}
      <div style={{ 
        backgroundColor: 'green', 
        color: 'white', 
        padding: '20px', 
        margin: '20px',
        borderRadius: '8px'
      }}>
        This is styled with inline styles (should always work)
      </div>
      
      {/* Test with direct CSS class */}
      <div className="test-direct-css">
        This is styled with direct CSS class from globals.css
      </div>
      
      {/* Test with simple Tailwind classes */}
      <div className="bg-blue-500 text-white p-4 m-4 rounded-lg">
        This is styled with Tailwind utilities (bg-blue-500)
      </div>
      
      {/* Test with custom Tailwind colors */}
      <div className="bg-primary-purple text-white p-4 m-4 rounded-lg">
        This is styled with custom Tailwind color (bg-primary-purple)
      </div>
      
      <div className="bg-dark-card text-dark-text p-4 m-4 rounded-lg">
        This is styled with dark theme colors (bg-dark-card)
      </div>
    </div>
  );
}