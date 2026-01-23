import { useCallback, useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  type RecordBackType,
} from "react-native-audio-recorder-player";
import { toast } from "sonner-native";
import { ApiService } from "./apiService";

interface AudioRecordingCallbacks {
  onRecordingStart?: () => void;
  onRecordingEnd?: () => void;
  onTranscriptionStart?: () => void;
  onTranscriptionComplete?: (text: string) => void;
  onTranscriptionError?: (error: string) => void;
  onRecordingProgress?: (time: string) => void;
}

export const useAudioRecording = (callbacks: AudioRecordingCallbacks) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordTime, setRecordTime] = useState("00:00:00");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      try {
        AudioRecorderPlayer.removeRecordBackListener();
      } catch (error) {
        console.log("Error removing listeners:", error);
      }
    };
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      try {
        const sdkInt = Platform.Version;

        if (sdkInt >= 33) {
          // Android 13+ only needs RECORD_AUDIO
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: "Audio Recording Permission",
              message:
                "This app needs access to your microphone to record audio.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK",
            }
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
          } else {
            return false;
          }
        } else {
          // Older Android versions need all permissions
          const grants = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          ]);

          if (
            grants["android.permission.RECORD_AUDIO"] ===
            PermissionsAndroid.RESULTS.GRANTED
          ) {
            return true;
          } else {
            return false;
          }
        }
      } catch (err) {
        console.warn("🎤 Android permission error:", err);
        return false;
      }
    }

    return true;
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    // Reset recording time when starting new recording
    setRecordTime("00:00:00");
    setIsLoading(true);

    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        toast.error("Please grant microphone permission to record audio.");
        setIsLoading(false);
        return false;
      }

      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: "aac" as const,
      };
      await AudioRecorderPlayer.startRecorder(undefined, audioSet, true);
      setIsRecording(true);
      setIsLoading(false);
      callbacks.onRecordingStart?.();

      AudioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
        const time =
          AudioRecorderPlayer?.mmssss(Math.floor(e.currentPosition)) ||
          "00:00:00";
        setRecordTime(time);
        callbacks.onRecordingProgress?.(time);
      });

      return true;
    } catch (error) {
      console.error("🎤 Start record error:", error);
      setIsLoading(false);
      setIsRecording(false);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Unknown error occurred");
      }
      return false;
    }
  }, [callbacks, requestPermissions]);

  const stopRecording = useCallback(async (): Promise<void> => {
    if (!AudioRecorderPlayer || !isRecording) {
      return;
    }

    try {
      const result = await AudioRecorderPlayer.stopRecorder();
      AudioRecorderPlayer.removeRecordBackListener();

      setIsRecording(false);
      callbacks.onRecordingEnd?.();

      // Start transcription
      await transcribeRecording(result);
    } catch (error) {
      setIsRecording(false);
      callbacks.onTranscriptionError?.("Failed to stop recording");
    }
  }, [isRecording, recordTime, callbacks]);

  const cancelRecording = useCallback(async (): Promise<void> => {
    if (!AudioRecorderPlayer || !isRecording) {
      return;
    }

    try {
      await AudioRecorderPlayer.stopRecorder();
      AudioRecorderPlayer.removeRecordBackListener();

      setIsRecording(false);
      setRecordTime("00:00:00");
      callbacks.onRecordingEnd?.();
    } catch (error) {
      setIsRecording(false);
    }
  }, [isRecording, callbacks]);

  const transcribeRecording = useCallback(
    async (audioPath: string): Promise<void> => {
      if (!audioPath) {
        callbacks.onTranscriptionError?.("No audio file to transcribe");
        return;
      }

      try {
        setIsTranscribing(true);
        callbacks.onTranscriptionStart?.();
        const result =
          await ApiService.transcription.transcribeAudio(audioPath);
        if (result && result.transcription) {
          callbacks.onTranscriptionComplete?.(result.transcription);
        } else {
          callbacks.onTranscriptionError?.("No transcription text received");
        }
      } catch (error) {
        callbacks.onTranscriptionError?.(
          error instanceof Error ? error.message : "Transcription failed"
        );
      } finally {
        setIsTranscribing(false);
      }
    },
    [callbacks]
  );

  return {
    isRecording,
    isTranscribing,
    isLoading,
    recordTime,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
