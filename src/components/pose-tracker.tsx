import { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { Loader2, Activity, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function PoseTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [counter, setCount] = useState(0);
  const [stage, setStage] = useState<"up" | "down">("up");
  const [feedback, setFeedback] = useState("Stand straight to start");
  const requestRef = useRef<number>();

  useEffect(() => {
    async function init() {
      try {
        await tf.ready();
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        };
        const newDetector = await poseDetection.createDetector(model, detectorConfig);
        setDetector(newDetector);
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setLoading(false);
          };
        }
      } catch (err: any) {
        toast.error("Failed to access camera or load AI model");
        console.error(err);
      }
    }
    init();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!detector || loading) return;

    const detect = async () => {
      if (videoRef.current && canvasRef.current && detector) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx && video.readyState === 4) {
          const poses = await detector.estimatePoses(video);
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (poses.length > 0) {
            const pose = poses[0];
            drawKeypoints(pose.keypoints, ctx);
            drawSkeleton(pose.keypoints, ctx);
            checkSquat(pose.keypoints);
          }
        }
      }
      requestRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [detector, loading]);

  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const checkSquat = (keypoints: poseDetection.Keypoint[]) => {
    const hip = keypoints.find(k => k.name === "left_hip" || k.name === "right_hip");
    const knee = keypoints.find(k => k.name === "left_knee" || k.name === "right_knee");
    const ankle = keypoints.find(k => k.name === "left_ankle" || k.name === "right_ankle");

    if (hip && knee && ankle && hip.score! > 0.3 && knee.score! > 0.3 && ankle.score! > 0.3) {
      const angle = calculateAngle(hip, knee, ankle);

      if (angle > 160) {
        if (stage === "down") {
          setCount(prev => prev + 1);
          setFeedback("Great rep! Go down again.");
        }
        setStage("up");
      }
      if (angle < 90) {
        setStage("down");
        setFeedback("Good depth! Now stand up.");
      }
    }
  };

  const drawKeypoints = (keypoints: poseDetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
    keypoints.forEach(keypoint => {
      if (keypoint.score! > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "#84cc16"; // Lime-500
        ctx.fill();
      }
    });
  };

  const drawSkeleton = (keypoints: poseDetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
    const adjacentKeypoints = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
    adjacentKeypoints.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];
      if (kp1.score! > 0.3 && kp2.score! > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative aspect-video overflow-hidden rounded-xl border-2 border-primary/20 bg-black shadow-2xl">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 text-white">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 font-medium">Loading AI Model & Camera...</p>
          </div>
        )}
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          width="640"
          height="480"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          width="640"
          height="480"
        />

        <div className="absolute top-4 left-4 flex gap-4">
          <Card className="flex items-center gap-3 bg-black/40 backdrop-blur-md border-white/20 p-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-70">Reps</p>
              <p className="text-2xl font-bold">{counter}</p>
            </div>
          </Card>
          
          <Card className="flex items-center gap-3 bg-black/40 backdrop-blur-md border-white/20 p-3 text-white">
            <div className="flex flex-col">
              <p className="text-[10px] uppercase tracking-wider opacity-70">Status</p>
              <p className="text-sm font-bold text-lime-400">{stage.toUpperCase()}</p>
            </div>
          </Card>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%]">
          <Card className="bg-primary/90 backdrop-blur-md border-none p-3 text-center text-white shadow-lg">
            <p className="text-sm font-medium">{feedback}</p>
          </Card>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => { setCount(0); setFeedback("Counter reset"); }}
          className="border-primary/20"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Counter
        </Button>
      </div>
    </div>
  );
}
