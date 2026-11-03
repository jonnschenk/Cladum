import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';

// jsdom no trae TextEncoder y React Router lo necesita
Object.assign(globalThis, { TextEncoder, TextDecoder });

// jsdom no implementa el desplazamiento
window.scrollTo = () => {};
