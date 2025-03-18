// client/src/components/PredictionGraph.js
import React, { useEffect, useRef } from 'react';

const PredictionGraph = ({ data }) => {
    const canvasRef = useRef(null);
    const MAX_POINTS = 60; // maximum values to show (e.g., 1 minute of data)

    useEffect(() => {
        console.log("PredictionGraph received data:", data);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Slice the data to only include the most recent MAX_POINTS values
        const displayData = data.length > MAX_POINTS ? data.slice(-MAX_POINTS) : data;

        // Clear the canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid lines (optional)
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        for (let y = 0; y <= height; y += height / 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Plot the line if we have at least two points
        if (displayData.length > 1) {
            ctx.beginPath();
            const maxVal = 100; // maximum percentage
            const minVal = 0;
            const stepX = width / (displayData.length - 1);
            displayData.forEach((value, index) => {
                // Invert y so that higher percentage is higher on the canvas
                const x = index * stepX;
                const y = height - ((value - minVal) / (maxVal - minVal)) * height;
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }, [data]);

    return (
        <canvas
            ref={canvasRef}
            width={200}
            height={100}
            style={{ border: '1px solid #ccc', backgroundColor: '#fff' }}
        />
    );
};

export default PredictionGraph;
