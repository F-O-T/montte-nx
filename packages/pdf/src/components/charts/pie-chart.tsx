import { G, Path, Svg, Text } from "@react-pdf/renderer";

type PieChartProps = {
   width: number;
   height: number;
   data: Array<{
      label: string;
      value: number;
      color: string;
   }>;
};

const TEXT_COLOR = "#374151";

function polarToCartesian(
   centerX: number,
   centerY: number,
   radius: number,
   angleInDegrees: number,
) {
   const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
   return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
   };
}

function describeArc(
   x: number,
   y: number,
   radius: number,
   startAngle: number,
   endAngle: number,
) {
   const start = polarToCartesian(x, y, radius, endAngle);
   const end = polarToCartesian(x, y, radius, startAngle);
   const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

   return [
      "M",
      x,
      y,
      "L",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "Z",
   ].join(" ");
}

export function PieChart({ width, height, data }: PieChartProps) {
   const centerX = width / 2 - 60;
   const centerY = height / 2;
   const radius = Math.min(centerX, centerY) - 10;

   const total = data.reduce((sum, item) => sum + item.value, 0);
   const filteredData = data.filter((item) => item.value > 0);

   let currentAngle = 0;
   const slices = filteredData.map((item) => {
      const angle = total > 0 ? (item.value / total) * 360 : 0;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;
      return {
         ...item,
         endAngle,
         percentage: total > 0 ? (item.value / total) * 100 : 0,
         startAngle,
      };
   });

   const legendX = width - 110;
   const legendY = 20;
   const legendItemHeight = 16;

   return (
      <Svg height={height} width={width}>
         <G>
            {slices.map((slice, index) => (
               <Path
                  d={describeArc(
                     centerX,
                     centerY,
                     radius,
                     slice.startAngle,
                     slice.endAngle,
                  )}
                  fill={slice.color}
                  key={`slice-${index}`}
               />
            ))}
         </G>

         <G>
            {slices.slice(0, 8).map((slice, index) => (
               <G key={`legend-${index}`}>
                  <Path
                     d={`M ${legendX} ${legendY + index * legendItemHeight} h 10 v 10 h -10 Z`}
                     fill={slice.color}
                  />
                  <Text
                     style={{
                        fill: TEXT_COLOR,
                        fontSize: 7,
                     }}
                     x={legendX + 15}
                     y={legendY + index * legendItemHeight + 8}
                  >
                     {slice.label.substring(0, 15)}
                     {slice.label.length > 15 ? "..." : ""} (
                     {slice.percentage.toFixed(1)}%)
                  </Text>
               </G>
            ))}
            {slices.length > 8 && (
               <Text
                  style={{
                     fill: TEXT_COLOR,
                     fontSize: 7,
                  }}
                  x={legendX}
                  y={legendY + 8 * legendItemHeight + 8}
               >
                  +{slices.length - 8} outros
               </Text>
            )}
         </G>
      </Svg>
   );
}
