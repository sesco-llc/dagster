// eslint-disable-next-line no-restricted-imports
import {Colors as BlueprintColors} from '@blueprintjs/core';
import {Meta} from '@storybook/react';
import nearestColor from 'nearest-color';
import rgbHex from 'rgb-hex';

import {Box} from '../Box';
import {LegacyColors} from '../LegacyColors';

const ColorExample = ({color, name}: {name: string; color: string}) => (
  <Box background={color} padding={12} style={{width: 120}}>
    {name}
  </Box>
);

// eslint-disable-next-line import/no-default-export
export default {
  title: 'Colors',
  component: ColorExample,
} as Meta;

const ColorsToHex = Object.keys(LegacyColors).reduce(
  (accum, key) => ({
    ...accum,
    [key]: `#${rgbHex(LegacyColors[key as keyof typeof LegacyColors]).slice(0, 6)}`,
  }),
  {},
);

const toCurrent = nearestColor.from(ColorsToHex);

const BlueprintToHex = Object.keys(BlueprintColors).reduce(
  (accum, key) => ({
    ...accum,
    [key]: `${BlueprintColors[key as keyof typeof BlueprintColors].slice(0, 7)}`,
  }),
  {},
);

export const Comparison = () => {
  return (
    <Box flex={{direction: 'row', gap: 4}}>
      <Box flex={{direction: 'column', alignItems: 'stretch', gap: 4}}>
        <div>Current colors</div>
        {Object.keys(ColorsToHex).map((key) => (
          <ColorExample key={key} name={key} color={ColorsToHex[key as keyof typeof ColorsToHex]} />
        ))}
      </Box>
      <Box flex={{direction: 'column', alignItems: 'stretch', gap: 4}}>
        <div>Blueprint colors</div>
        {Object.keys(BlueprintToHex).map((key) => (
          <Box flex={{direction: 'row', gap: 4, alignItems: 'center'}} key={key}>
            <ColorExample name={key} color={BlueprintToHex[key as keyof typeof BlueprintToHex]} />
            <div>{toCurrent(BlueprintToHex[key as keyof typeof BlueprintToHex]).name}</div>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
