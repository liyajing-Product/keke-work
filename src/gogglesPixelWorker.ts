import { preparePixels, paintPixels, type PreparedView } from './gogglesPixels';
const views = new Map<number, PreparedView>();
const scope = self as unknown as {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};
scope.onmessage = ({ data }) => {
  const { requestId, viewId, kind } = data;
  try {
    if (kind === 'prepare') {
      views.set(viewId, preparePixels(data.base));
      scope.postMessage({ requestId });
    } else {
      const view = views.get(viewId);
      if (!view) throw new Error('Product angle is not prepared');
      const painted = paintPixels(view, data.hex, data.original);
      scope.postMessage({ requestId, ...painted }, [painted.body.data.buffer, painted.lens.data.buffer]);
    }
  } catch (error) { scope.postMessage({ requestId, error: String(error) }); }
};
