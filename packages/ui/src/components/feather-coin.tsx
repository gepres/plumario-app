import Svg, { Circle, Path } from 'react-native-svg';

/** La moneda de las plumas (MonedaPluma): plana y con borde bronce, para no confundirla con el acabado oro. */
export function FeatherCoin({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="Plumas">
      <Circle cx={24} cy={24} r={23} fill="#8A4F12" />
      <Circle cx={24} cy={24} r={20} fill="#F0C14B" />
      <Circle cx={24} cy={24} r={17.5} fill="none" stroke="#B9782A" strokeWidth={1.5} strokeDasharray="1.5 3" />
      <Path d="M34.5 12.5c-7.8.3-14 4.2-16.6 11.2-1.1 3-1.3 5.9-.8 8.2l-3.6 4.6 2.2 1.7 3.5-4.5c2.8.7 5.9.2 8.6-1.4 6.4-3.7 8.8-11.7 6.7-19.8z" fill="#5A3F0E" />
      <Path d="M19.5 31.2c3.4-5.9 7.2-10.3 12-13.9" fill="none" stroke="#F0C14B" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M24.6 25.8l5.5.6M21.9 29.6l4.6 1.1M27.6 22l1.2-4.4" fill="none" stroke="#F0C14B" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
