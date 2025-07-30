import React, { useEffect, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import { 
  useSharedValue, 
  withTiming, 
  runOnJS,
  useAnimatedReaction
} from 'react-native-reanimated';
import { formatNumber } from '@/libs/string.helpers';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: TextStyle;
  prefix?: string;
  formatter?: (value: number) => string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  style,
  prefix = '',
  formatter = formatNumber
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);

  // Update display value on JS thread
  const updateDisplayValue = (newValue: number) => {
    setDisplayValue(Math.floor(newValue));
  };

  // React to animated value changes
  useAnimatedReaction(
    () => animatedValue.value,
    (currentValue) => {
      runOnJS(updateDisplayValue)(currentValue);
    }
  );

  // Update the animation when the value changes
  useEffect(() => {
    animatedValue.value = withTiming(value, { duration });
  }, [value, duration, animatedValue]);

  // Initialize display value
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <Text style={style}>
      {prefix + formatter(displayValue)}
    </Text>
  );
};

export default AnimatedCounter;
