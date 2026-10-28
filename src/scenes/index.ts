import type React from 'react';
import {Apparent} from './Apparent';
import {Archimedes} from './Archimedes';
import {Atmosphere} from './Atmosphere';
import {Blood} from './Blood';
import {Capillary} from './Capillary';
import {Chroma} from './Chroma';
import {Density} from './Density';
import {Floating} from './Floating';
import {Hook} from './Hook';
import {Hydro} from './Hydro';
import {Hydrometer} from './Hydrometer';
import {Iceberg} from './Iceberg';
import {Manometer} from './Manometer';
import {Outro} from './Outro';
import {Pascal} from './Pascal';
import {Pressure} from './Pressure';
import {Recap} from './Recap';
import {Roadmap} from './Roadmap';
import {Soap} from './Soap';
import {Strategy} from './Strategy';
import {Submarine} from './Submarine';
import {Surface} from './Surface';
import {Title} from './Title';

// Pemetaan id adegan di naskah → komponen visual.
export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  title: Title,
  roadmap: Roadmap,
  density: Density,
  pressure: Pressure,
  hydro: Hydro,
  atmosphere: Atmosphere,
  manometer: Manometer,
  pascal: Pascal,
  archimedes: Archimedes,
  apparent: Apparent,
  floating: Floating,
  surface: Surface,
  capillary: Capillary,
  strategy: Strategy,
  hydrometer: Hydrometer,
  soap: Soap,
  chroma: Chroma,
  submarine: Submarine,
  blood: Blood,
  iceberg: Iceberg,
  recap: Recap,
  outro: Outro,
};
