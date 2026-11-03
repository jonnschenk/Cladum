import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from '../app/store.js';
import { fetchSpecies } from '../features/species/speciesSlice.js';
import { mockApis, jaguar, page } from '../test/apiMocks.js';
import { useDebounce } from './useDebounce.js';
import { useSlowNotice } from './useSlowNotice.js';
import { useCountdown } from './useCountdown.js';
import { usePhotoFallback } from './usePhotoFallback.js';
import { useSuggestions } from './useSuggestions.js';
import { useThunk } from './useThunk.js';

const { gbifMock, inatMock, reset } = mockApis();
beforeEach(reset);
afterEach(() => jest.useRealTimers());

describe('useDebounce', () => {
  test('entrega el valor solo cuando deja de cambiar', () => {
    jest.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 250), { initialProps: { value: 'a' } });
    rerender({ value: 'ab' });
    act(() => jest.advanceTimersByTime(200));
    rerender({ value: 'abc' });
    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe('a');
    act(() => jest.advanceTimersByTime(50));
    expect(result.current).toBe('abc');
  });
});

describe('useSlowNotice', () => {
  test('avisa si la carga supera el umbral y se apaga al terminar', () => {
    jest.useFakeTimers();
    const { result, rerender } = renderHook(({ loading }) => useSlowNotice(loading, 3000), { initialProps: { loading: true } });
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(3000));
    expect(result.current).toBe(true);
    rerender({ loading: false });
    expect(result.current).toBe(false);
  });
});

describe('useCountdown', () => {
  test('cuenta hacia atrás y avisa una sola vez al llegar a cero', () => {
    jest.useFakeTimers();
    const onDone = jest.fn();
    const { result } = renderHook(() => useCountdown(3, onDone));
    expect(result.current).toBe(3);
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe(2);
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current).toBe(0);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('con 0 segundos no hace nada', () => {
    jest.useFakeTimers();
    const onDone = jest.fn();
    renderHook(() => useCountdown(0, onDone));
    act(() => jest.advanceTimersByTime(5000));
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('usePhotoFallback', () => {
  const gbifPhoto = (n) => ({ source: 'gbif', url: `https://a.org/${n}.jpg` });
  const inatTaxon = { results: [{ id: 41970, name: 'Panthera onca' }] };
  const inatPhotos = {
    results: [{ taxon_photos: [{ photo: { id: 9, license_code: 'cc-by', url: 'https://static.inaturalist.org/photos/9/square.jpg' } }] }],
  };

  test('retira la foto que no carga', () => {
    const initial = [gbifPhoto(1), gbifPhoto(2)];
    const { result } = renderHook(() => usePhotoFallback(initial, 'Panthera onca'));
    act(() => result.current.markBroken('https://a.org/1.jpg'));
    expect(result.current.photos.map((p) => p.url)).toEqual(['https://a.org/2.jpg']);
    expect(result.current.broken).toBe(true);
  });

  test('si se caen todas las de GBIF, usa iNaturalist', async () => {
    inatMock.onGet('/taxa').reply(200, inatTaxon);
    inatMock.onGet('/taxa/41970').reply(200, inatPhotos);
    const initial = [gbifPhoto(1)];
    const { result } = renderHook(() => usePhotoFallback(initial, 'Panthera onca'));
    act(() => result.current.markBroken('https://a.org/1.jpg'));
    await waitFor(() => expect(result.current.photos).toHaveLength(1));
    expect(result.current.photos[0].source).toBe('inaturalist');
  });

  test('si la lista ya venía de iNaturalist, no hay más respaldo', async () => {
    const initial = [{ source: 'inaturalist', url: 'https://static.inaturalist.org/photos/9/medium.jpg' }];
    const { result } = renderHook(() => usePhotoFallback(initial, 'Panthera onca'));
    act(() => result.current.markBroken(initial[0].url));
    expect(result.current.photos).toEqual([]);
    expect(inatMock.history.get).toHaveLength(0);
  });
});

describe('useSuggestions', () => {
  test('espera a que dejes de escribir y no busca con menos de 2 letras', async () => {
    gbifMock.onGet('/species/suggest').reply(200, [jaguar]);
    const { result, rerender } = renderHook(({ value }) => useSuggestions(value, 10), { initialProps: { value: 'P' } });
    await new Promise((r) => setTimeout(r, 30));
    expect(gbifMock.history.get).toHaveLength(0);
    rerender({ value: 'Pant' });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items[0].canonicalName).toBe('Panthera onca');
    expect(gbifMock.history.get[0].params.q).toBe('Pant');
  });
});

describe('useThunk', () => {
  test('despacha al montar y retry vuelve a despachar', async () => {
    gbifMock.onGet('/species/1').replyOnce(503).onGet('/species/1').reply(200, { ...jaguar, key: 1 });
    gbifMock.onGet().reply(200, page([]));
    const store = makeStore();
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useThunk(fetchSpecies, 1), { wrapper });
    await waitFor(() => expect(store.getState().species.status).toBe('failed'));
    act(() => result.current());
    await waitFor(() => expect(store.getState().species.status).toBe('succeeded'));
  });
});
