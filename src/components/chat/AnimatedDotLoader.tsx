import React, { useRef, useEffect } from "react";
import { View, Animated, StyleSheet } from "react-native";

interface AnimatedDotLoaderProps {
  color?: string;
  size?: number;
}

const AnimatedDotLoader: React.FC<AnimatedDotLoaderProps> = ({
  color = "#c1fe00",
  size = 16,
}) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.2,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 0.8,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };
    animate();
    // Cleanup
    return () => {
      scale.stopAnimation();
      opacity.stopAnimation();
    };
  }, [scale, opacity]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.bubble,
          {
            backgroundColor: color,
            width: size,
            height: size,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 24,
  },
  bubble: {
    borderRadius: 50,
    shadowColor: "#c1fe00",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AnimatedDotLoader;
