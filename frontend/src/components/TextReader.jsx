import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';

const TextReader = () => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const processImage = async (file) => {
    setIsProcessing(true);
    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data } = await worker.recognize(file);
    setText(data.text);
    setIsProcessing(false);
  };

  return (
    <div>
      <h2>Document Reader</h2>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => processImage(e.target.files[0])}
      />
      {isProcessing ? <p>Processing...</p> : <p>{text}</p>}
    </div>
  );
};

export default TextReader;
