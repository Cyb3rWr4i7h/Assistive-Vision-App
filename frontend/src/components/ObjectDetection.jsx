import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as cocossd from '@tensorflow-models/coco-ssd';

const ObjectDetection = () => {
  const webcamRef = useRef(null);
  const [detections, setDetections] = useState([]);

  useEffect(() => {
    const loadModel = async () => {
      const model = await cocossd.load();
      setInterval(async () => {
        if (webcamRef.current?.video.readyState === 4) {
          const predictions = await model.detect(webcamRef.current.video);
          setDetections(predictions);
        }
      }, 1000);
    };
    loadModel();
  }, []);

  return (
    <div>
      <h2>Real-Time Object Detection</h2>
      <Webcam ref={webcamRef} className="w-full h-auto" />
      <div>
        {detections.map((detection, index) => (
          <p key={index}>{`${detection.class} - ${Math.round(detection.score * 100)}%`}</p>
        ))}
      </div>
    </div>
  );
};

export default ObjectDetection;
