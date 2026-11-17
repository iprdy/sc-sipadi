import { RegionOption } from '../types';

export const AVAILABLE_REGIONS: RegionOption[] = [
  { id: 'tabanan', name: 'Tabanan' },
  { id: 'badung', name: 'Badung' },
  { id: 'gianyar', name: 'Gianyar' },
  { id: 'buleleng', name: 'Buleleng' },
  { id: 'bangli', name: 'Bangli' },
  { id: 'jembrana', name: 'Jembrana' },
  { id: 'karangasem', name: 'Karangasem' },
  { id: 'klungkung', name: 'Klungkung' },
  { id: 'denpasar', name: 'Kota Denpasar' },
];

export const AVAILABLE_YEARS = [
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;
