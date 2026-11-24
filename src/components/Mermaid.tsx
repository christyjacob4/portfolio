"use client";

import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

// Initialize mermaid with better settings for React
mermaid.initialize({
  startOnLoad: false, // Don't auto-start, we'll manually render
  theme: 'dark', // Use dark theme since the site has a dark background
  securityLevel: 'loose',
  themeVariables: {
    // Improve text contrast for dark theme
    primaryTextColor: '#ffffff',      // Main text - brighter white
    primaryColor: '#ffffff',          // Main color - brighter white
    primaryBorderColor: '#ffffff',    // Borders - brighter white
    lineColor: '#ffffff',             // Lines - brighter white
    secondaryColor: '#90EE90',        // Secondary color - light green
    tertiaryColor: '#ffffff',         // Tertiary color - brighter white
    noteTextColor: '#000000',         // Text in notes - black for contrast
    noteBkgColor: '#fff176',          // Background of notes - yellowish
    edgeLabelBackground: '#333333',   // Background for edge labels - darker
    edgeColor: '#ffffff',             // Color of edges/arrows - brighter white
    textColor: '#ffffff',             // General text color - brighter white
    mainBkg: '#1a1a1a',               // Main background - darker
    nodeBorder: '#ffffff',            // Node border color - brighter white
    labelTextColor: '#ffffff',        // Label text color - brighter white
    labelBoxBorderColor: '#ffffff',   // Label box border - brighter white
    labelBoxBkgColor: '#333333',      // Label box background - darker gray
    messageTextColor: '#ffffff',      // Message text on sequence diagrams - brighter white
    actorTextColor: '#ffffff',        // Actor text color - brighter white
    actorBkg: '#333333',              // Actor background - darker gray
    signalColor: '#ffffff',           // Signal lines - brighter white
    signalTextColor: '#ffffff',       // Signal text - brighter white
    loopTextColor: '#ffffff',         // Loop text - brighter white
    activationBorderColor: '#ffffff', // Activation border - brighter white
    activationBkgColor: '#555555',    // Activation background - medium gray
    sequenceNumberColor: '#ffffff',   // Sequence numbers - brighter white
  }
});

type MermaidProps = {
  readonly chart: string;
};

const Mermaid = ({ chart }: MermaidProps): React.JSX.Element => {
  const [svg, setSvg] = useState<string>("");
  const [id] = useState<string>(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    const renderChart = async () => {
      try {
        // Use the mermaid API to render the diagram to SVG
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
      } catch (error) {
        console.error("Error rendering mermaid chart:", error);
      }
    };
    
    renderChart();
  }, [chart, id]);
    
  // If we have rendered SVG, display it, otherwise show a loading message
  return svg ? (
    <div 
      className="mermaid-diagram my-6" 
      dangerouslySetInnerHTML={{ __html: svg }} 
      style={{ color: 'white' }}
    />
  ) : (
    <div className="p-4 bg-gray-800 rounded-sm my-6">
      <p className="text-white">Loading diagram...</p>
    </div>
  );
};

export default Mermaid; 