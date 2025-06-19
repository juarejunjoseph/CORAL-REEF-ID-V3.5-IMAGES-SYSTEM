import { useState, useEffect, useRef } from 'react';

function LoadingScreen() {
    return (
        <div className="loading-screen" style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "#222", color: "#fff", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
            <div className="spinner" style={{
                border: "8px solid #f3f3f3",
                borderTop: "8px solid #3498db",
                borderRadius: "50%",
                width: "60px",
                height: "60px",
                animation: "spin 1s linear infinite",
                marginBottom: "20px"
            }} />
            <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
                Loading Artificial Neural Network...
            </div>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                    }
                `}
            </style>
        </div>
    );
}

function App() {
    // All hooks (useState, useRef, useEffect) must be called at the top level unconditionally
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [showLoadingScreen, setShowLoadingScreen] = useState(true);
    const [model, setModel] = useState(null);
    const [imageURL, setImageURL] = useState(null);
    const [results, setResults] = useState([]);
    const [history, setHistory] = useState([]);
    const [isRealtimeScanning, setIsRealtimeScanning] = useState(false); // New state for realtime mode

    const imageRef = useRef();
    const fileInputRef = useRef();
    const cameraInputRef = useRef();
    const videoRef = useRef(); // New ref for video element
    const canvasRef = useRef(); // New ref for canvas element to capture frames

    // Define all functions *before* any conditional returns
    const loadModel = async () => {
        try {
            const modelURL = `${window.location.origin}/coralimagemodel/model.json`;
            const metadataURL = `${window.location.origin}/coralimagemodel/metadata.json`;
            if (!window.tmImage) {
                console.error("Teachable Machine library not loaded");
                setIsModelLoading(false);
                return;
            }
            const model = await window.tmImage.load(modelURL, metadataURL);
            setModel(model);
            setIsModelLoading(false);
        } catch (error) {
            console.error("Error loading model:", error);
            setIsModelLoading(false);
        }
    };

    const identify = async () => {
        if (!model || !imageRef.current) return;
        try {
            const predictions = await model.predict(imageRef.current);
            // Filter and sort predictions
            const formattedResults = predictions
                .map(p => ({
                    className: p.className,
                    probability: p.probability
                }))
                .filter(result => result.probability * 100 >= 0.01 && result.probability * 100 <= 100) // 0.01% to 100%
                .sort((a, b) => b.probability - a.probability)
                .slice(0, 3); // Top 3 predictions only
            setResults(formattedResults);
            if (imageURL && !history.includes(imageURL)) {
                setHistory([imageURL, ...history]);
            }
        } catch (error) {
            console.error("Error identifying image:", error);
        }
    };

    // New function to identify from video frame
    const identifyFromVideo = async () => {
        if (!model || !videoRef.current || !canvasRef.current) return;
        
        try {
            // Draw the current video frame to the canvas
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            
            // Make prediction on the canvas
            const predictions = await model.predict(canvas);
            
            // Filter and sort predictions (same logic as identify function)
            const formattedResults = predictions
                .map(p => ({
                    className: p.className,
                    probability: p.probability
                }))
                .filter(result => result.probability * 100 >= 0.01 && result.probability * 100 <= 100)
                .sort((a, b) => b.probability - a.probability)
                .slice(0, 3);
            
            setResults(formattedResults);
            
            // If we have a significant detection (confidence > 70%), capture the frame
            if (formattedResults.length > 0 && formattedResults[0].probability > 0.7) {
                // Convert canvas to data URL
                const capturedImage = canvas.toDataURL('image/jpeg');
                
                // Add to history if not already included
                if (!history.includes(capturedImage)) {
                    setHistory(prevHistory => [capturedImage, ...prevHistory]);
                }
            }
            
            // Continue scanning if still in realtime mode
            if (isRealtimeScanning) {
                requestAnimationFrame(identifyFromVideo);
            }
        } catch (error) {
            console.error("Error identifying video frame:", error);
            if (isRealtimeScanning) {
                requestAnimationFrame(identifyFromVideo);
            }
        }
    };

    const uploadImage = (e) => {
        const { files } = e.target;
        setResults([]);
        if (files.length > 0) {
            const url = URL.createObjectURL(files[0]);
            setImageURL(url);
        } else {
            setImageURL(null);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current.click();
    };

    const triggerCamera = () => {
        cameraInputRef.current.click();
    };

    // New function to start realtime scanning
    const startRealtimeScan = async () => {
        try {
            setIsRealtimeScanning(true);
            setResults([]);
            
            // Access the camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Use back camera if available
            });
            
            // Set the video source to the camera stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    // Start the identification process
                    identifyFromVideo();
                };
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            setIsRealtimeScanning(false);
        }
    };
    
    // New function to stop realtime scanning
    const stopRealtimeScan = () => {
        setIsRealtimeScanning(false);
        
        // Stop all video tracks
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        // Show loading screen for minimum 2 seconds
        const loadingTimer = setTimeout(() => {
            setShowLoadingScreen(false);
        }, 2000);

        loadModel();

        return () => clearTimeout(loadingTimer);
    }, []); // Empty dependency array means this runs once on mount

    // Now, the conditional return for the loading screen is after all hooks and function definitions
    if (showLoadingScreen || isModelLoading) {
        return <LoadingScreen />;
    }
    
    // Conditional rendering based on scanning mode
    if (isRealtimeScanning) {
        return (
            <div className="App">
                <h1 className='header'>Coral Reef Identification Sys - Realtime</h1>
                <div className="mainWrapper">
                    <div className="mainContent">
                        <div className="videoHolder" style={{ position: 'relative' }}>
                            <video 
                                ref={videoRef} 
                                style={{ width: '100%', maxWidth: '500px', border: '1px solid #ddd' }} 
                                autoPlay 
                                playsInline 
                                muted
                            />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>
                        {results.length > 0 && <div className='resultsHolder'>
                            {results.map((result) => {
                                const confidence = (result.probability * 100).toFixed(2);
                                const isBestGuess = confidence >= 99;
                                return (
                                    <div className='result' key={result.className}>
                                        <span className='name'>{isBestGuess ? `${result.className} (Best Guess)` : result.className}</span>
                                        <span className='confidence'>
                                            Confidence level: {confidence}%
                                        </span>
                                    </div>
                                )
                            })}
                        </div>}
                    </div>
                </div>
                <button 
                    className='stopScan' 
                    onClick={stopRealtimeScan} 
                    style={{ margin: '10px', padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Stop Scan
                </button>
                {history.length > 0 && <div className="recentPredictions">
                    <h2>Recent Images</h2>
                    <div className="recentImages">
                        {history.map((image, index) => (
                            <div className="recentPrediction" key={`${image}${index}`}>
                                <img src={image} alt='Recent Prediction' onClick={() => {
                                    stopRealtimeScan();
                                    setImageURL(image);
                                }} />
                            </div>
                        ))}
                    </div>
                </div>}
            </div>
        );
    }

    // Original UI for regular mode
    return (
        <div className="App">
            <h1 className='header'>Coral Reef Identification Sys</h1>
            <div className='inputHolder'>
                <input type='file' accept='image/*' className='uploadInput' onChange={uploadImage} ref={fileInputRef} style={{ display: 'none' }} />
                <input type='file' accept='image/*' capture='environment' className='uploadInput' onChange={uploadImage} ref={cameraInputRef} style={{ display: 'none' }} />
                <button className='uploadImage' onClick={triggerUpload}>Upload from Gallery</button>
                <button className='captureImage' onClick={triggerCamera}>Capture Image</button>
                <button className='realtimeScan' onClick={startRealtimeScan} > Scan Realtime </button>
            </div>
            <div className="mainWrapper">
                <div className="mainContent">
                    <div className="imageHolder">
                        {imageURL && <img src={imageURL} alt="Upload Preview" crossOrigin="anonymous" ref={imageRef} onLoad={identify} />}
                    </div>
                    {results.length > 0 && <div className='resultsHolder'>
                        {results.map((result) => {
                            const confidence = (result.probability * 100).toFixed(2);
                            const isBestGuess = confidence >= 99;
                            return (
                                <div className='result' key={result.className}>
                                    <span className='name'>{isBestGuess ? `${result.className} (Best Guess)` : result.className}</span>
                                    <span className='confidence'>
                                        Confidence level: {confidence}%
                                    </span>
                                </div>
                            )
                        })}
                    </div>}
                </div>
            </div>
            {history.length > 0 && <div className="recentPredictions">
                <h2>Recent Images</h2>
                <div className="recentImages">
                    {history.map((image, index) => (
                        <div className="recentPrediction" key={`${image}${index}`}>
                            <img src={image} alt='Recent Prediction' onClick={() => setImageURL(image)} />
                        </div>
                    ))}
                </div>
            </div>}
        </div>
    );
}

export default App;
