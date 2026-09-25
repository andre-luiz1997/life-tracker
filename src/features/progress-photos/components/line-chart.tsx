import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

import { chartCoordinates, type MetricPoint } from '../lib/metrics';

type LineChartProps = {
  points: MetricPoint[];
  color: string;
  height?: number;
  /** Screen-reader summary (the chart itself is decorative). */
  accessibilityLabel: string;
};

/** Minimal time-series line chart (values over dates). */
export function LineChart({ points, color, height = 140, accessibilityLabel }: LineChartProps) {
  const [width, setWidth] = useState(0);
  const coords = useMemo(
    () => chartCoordinates(points, width, height, 10),
    [points, width, height],
  );

  const path = useMemo(() => {
    const p = Skia.Path.Make();
    coords.forEach((c, i) => (i === 0 ? p.moveTo(c.x, c.y) : p.lineTo(c.x, c.y)));
    return p;
  }, [coords]);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{ height }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}>
      {width > 0 ? (
        <Canvas style={{ width, height }}>
          <Path
            path={path}
            color={color}
            style="stroke"
            strokeWidth={2.5}
            strokeJoin="round"
            strokeCap="round"
          />
          {coords.map((c, i) => (
            <Circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 5 : 3} color={color} />
          ))}
        </Canvas>
      ) : null}
    </View>
  );
}
