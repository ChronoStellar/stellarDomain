/**
 * Constellation data from real star catalogs.
 *
 * Each star carries its true equatorial coordinates — right ascension in hours
 * and declination in degrees (epoch J2000) — plus apparent visual magnitude.
 * Lines are the conventional figure joins used on star charts, indexed into
 * each constellation's own star list.
 *
 * Magnitudes follow the astronomical convention: lower is brighter. Sirius is
 * -1.46, the faintest naked-eye stars are around 6.
 */

export interface Star {
  /** Right ascension, hours (0–24). */
  ra: number;
  /** Declination, degrees (-90 to +90). */
  dec: number;
  /** Apparent visual magnitude; lower is brighter. */
  mag: number;
  name?: string;
}

export interface Constellation {
  name: string;
  stars: Star[];
  /** Index pairs into `stars`, forming the drawn figure. */
  lines: [number, number][];
}

export const CONSTELLATIONS: Constellation[] = [
  {
    name: 'Orion',
    stars: [
      { ra: 5.9195, dec: 7.4071, mag: 0.42, name: 'Betelgeuse' },
      { ra: 5.4188, dec: 6.3497, mag: 1.64, name: 'Bellatrix' },
      { ra: 5.5334, dec: -0.2991, mag: 2.23, name: 'Mintaka' },
      { ra: 5.6036, dec: -1.2019, mag: 1.69, name: 'Alnilam' },
      { ra: 5.6793, dec: -1.9426, mag: 1.77, name: 'Alnitak' },
      { ra: 5.2423, dec: -8.2016, mag: 0.18, name: 'Rigel' },
      { ra: 5.7959, dec: -9.6696, mag: 2.07, name: 'Saiph' },
      { ra: 5.5876, dec: -5.3897, mag: 2.77, name: 'Hatysa' },
      { ra: 5.5860, dec: 9.9342, mag: 3.39, name: 'Meissa' },
    ],
    lines: [
      // Shoulders, belt, legs, plus the sword hanging from the belt and the
      // head star that fixes Orion's orientation.
      [1, 0], [0, 8], [8, 1], [1, 2], [0, 4], [2, 3], [3, 4],
      [2, 5], [4, 6], [5, 6], [3, 7],
    ],
  },
  {
    name: 'Ursa Major',
    stars: [
      { ra: 11.0621, dec: 61.7510, mag: 1.79, name: 'Dubhe' },
      { ra: 11.0307, dec: 56.3824, mag: 2.37, name: 'Merak' },
      { ra: 11.8972, dec: 53.6948, mag: 2.44, name: 'Phecda' },
      { ra: 12.2571, dec: 57.0326, mag: 3.31, name: 'Megrez' },
      { ra: 12.9005, dec: 55.9598, mag: 1.77, name: 'Alioth' },
      { ra: 13.3987, dec: 54.9254, mag: 2.27, name: 'Mizar' },
      { ra: 13.7923, dec: 49.3133, mag: 1.86, name: 'Alkaid' },
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6],
    ],
  },
  {
    name: 'Cassiopeia',
    stars: [
      { ra: 0.1533, dec: 59.1498, mag: 2.24, name: 'Caph' },
      { ra: 0.6751, dec: 56.5373, mag: 2.24, name: 'Schedar' },
      { ra: 0.9451, dec: 60.7167, mag: 2.47, name: 'Gamma Cas' },
      { ra: 1.4304, dec: 60.2353, mag: 2.68, name: 'Ruchbah' },
      { ra: 1.9066, dec: 63.6701, mag: 3.38, name: 'Segin' },
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4],
    ],
  },
  {
    name: 'Cygnus',
    stars: [
      { ra: 20.6905, dec: 45.2803, mag: 1.25, name: 'Deneb' },
      { ra: 20.3705, dec: 40.2567, mag: 2.23, name: 'Sadr' },
      { ra: 19.5120, dec: 27.9597, mag: 3.18, name: 'Albireo' },
      { ra: 19.9382, dec: 35.0834, mag: 2.86, name: 'Delta Cyg' },
      { ra: 20.7702, dec: 33.9703, mag: 2.46, name: 'Gienah' },
    ],
    lines: [
      [0, 1], [1, 2], [3, 1], [1, 4],
    ],
  },
  {
    name: 'Lyra',
    stars: [
      { ra: 18.6156, dec: 38.7837, mag: 0.03, name: 'Vega' },
      { ra: 18.7461, dec: 37.6051, mag: 4.34, name: 'Epsilon Lyr' },
      { ra: 18.8346, dec: 33.3627, mag: 3.52, name: 'Sheliak' },
      { ra: 18.9822, dec: 32.6896, mag: 3.24, name: 'Sulafat' },
      { ra: 18.9086, dec: 36.8986, mag: 4.22, name: 'Zeta Lyr' },
    ],
    lines: [
      [0, 1], [1, 4], [4, 2], [2, 3], [3, 4],
    ],
  },
  {
    // The tail needs its full run of stars: with only the bright few, the
    // figure straightens into a diagonal line and loses the hooked sting that
    // makes Scorpius identifiable.
    name: 'Scorpius',
    stars: [
      { ra: 16.0906, dec: -19.8054, mag: 2.62, name: 'Acrab' },
      { ra: 16.0056, dec: -22.6217, mag: 2.29, name: 'Dschubba' },
      { ra: 15.9800, dec: -26.1141, mag: 2.89, name: 'Pi Sco' },
      { ra: 16.3533, dec: -25.5928, mag: 2.88, name: 'Sigma Sco' },
      { ra: 16.4901, dec: -26.4320, mag: 1.06, name: 'Antares' },
      { ra: 16.8360, dec: -28.2160, mag: 2.82, name: 'Tau Sco' },
      { ra: 16.8360, dec: -34.2933, mag: 2.29, name: 'Epsilon Sco' },
      { ra: 16.8643, dec: -38.0175, mag: 3.00, name: 'Mu Sco' },
      { ra: 16.9120, dec: -42.3612, mag: 3.62, name: 'Zeta Sco' },
      { ra: 17.2027, dec: -43.2392, mag: 3.33, name: 'Eta Sco' },
      { ra: 17.6222, dec: -42.9978, mag: 1.87, name: 'Sargas' },
      { ra: 17.7932, dec: -40.1270, mag: 3.03, name: 'Iota Sco' },
      { ra: 17.7083, dec: -39.0299, mag: 2.41, name: 'Girtab' },
      { ra: 17.5601, dec: -37.1038, mag: 1.62, name: 'Shaula' },
      { ra: 17.5127, dec: -37.2958, mag: 2.70, name: 'Lesath' },
    ],
    lines: [
      [0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
    ],
  },
  {
    // Completes the Summer Triangle with Vega (Lyra) and Deneb (Cygnus).
    // Altair is flanked by Tarazed and Alshain — the close three-in-a-row that
    // makes Aquila identifiable at a glance.
    name: 'Aquila',
    stars: [
      { ra: 19.8464, dec: 8.8683, mag: 0.76, name: 'Altair' },
      { ra: 19.7710, dec: 10.6133, mag: 2.72, name: 'Tarazed' },
      { ra: 19.9219, dec: 6.4068, mag: 3.71, name: 'Alshain' },
      { ra: 19.4255, dec: 3.1148, mag: 3.36, name: 'Delta Aql' },
      { ra: 19.0921, dec: 13.8635, mag: 2.99, name: 'Zeta Aql' },
      { ra: 20.1883, dec: -0.8215, mag: 3.44, name: 'Theta Aql' },
      { ra: 19.1041, dec: -4.8823, mag: 3.24, name: 'Lambda Aql' },
      { ra: 18.9935, dec: 15.0680, mag: 4.02, name: 'Epsilon Aql' },
    ],
    lines: [
      [1, 0], [0, 2], [4, 1], [7, 4], [1, 3], [3, 6], [2, 5], [3, 5],
    ],
  },
  {
    name: 'Crux',
    stars: [
      { ra: 12.4433, dec: -63.0991, mag: 0.77, name: 'Acrux' },
      { ra: 12.7953, dec: -59.6888, mag: 1.25, name: 'Mimosa' },
      { ra: 12.5194, dec: -57.1132, mag: 1.59, name: 'Gacrux' },
      { ra: 12.2525, dec: -58.7489, mag: 2.79, name: 'Imai' },
    ],
    lines: [
      [0, 2], [1, 3],
    ],
  },
];

/**
 * Convert equatorial coordinates to a point on a sphere of the given radius.
 *
 * RA increases eastward, so it maps to the azimuthal angle; declination maps to
 * altitude. The result is the real sky geometry, which is what makes the
 * figures recognisable rather than merely star-like.
 */
export function equatorialToCartesian(
  ra: number,
  dec: number,
  radius: number,
): [number, number, number] {
  const raRad = (ra / 24) * Math.PI * 2;
  const decRad = (dec / 180) * Math.PI;
  return [
    radius * Math.cos(decRad) * Math.cos(raRad),
    radius * Math.sin(decRad),
    radius * Math.cos(decRad) * Math.sin(raRad),
  ];
}

/** Point size for a magnitude — brighter stars render larger. */
export function magnitudeToSize(mag: number, scale = 1): number {
  // Roughly perceptual: each magnitude step is a noticeable size change,
  // clamped so faint stars stay visible and bright ones don't blow out.
  return Math.max(1.6, (6.2 - mag) * 1.5) * scale;
}

/** Opacity for a magnitude — brighter stars are more opaque. */
export function magnitudeToOpacity(mag: number): number {
  return Math.min(1, Math.max(0.42, (6.5 - mag) / 5.2));
}
