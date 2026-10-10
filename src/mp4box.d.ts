declare module 'mp4box' {
  export interface Sample {
    cts: number;
    duration: number;
    timescale: number;
    is_sync: boolean;
    data: Uint8Array;
  }
  export interface Track {
    id: number;
    codec: string;
    duration: number;
    timescale: number;
    nb_samples: number;
    video: { width: number; height: number };
  }
  interface CodecBox { write(stream: DataStream): void }
  export interface MP4File {
    onReady?: (info: { videoTracks: Track[] }) => void;
    onError?: (message: string) => void;
    onSamples?: (id: number, user: unknown, samples: Sample[]) => void;
    appendBuffer(buffer: ArrayBuffer & { fileStart: number }): void;
    flush(): void;
    start(): void;
    stop(): void;
    setExtractionOptions(id: number, user: unknown, options: { nbSamples: number }): void;
    getTrackById(id: number): { mdia: { minf: { stbl: { stsd: { entries: Array<Record<string, CodecBox>> } } } } };
  }
  export function createFile(): MP4File;
  export class DataStream {
    static BIG_ENDIAN: boolean;
    constructor(buffer?: ArrayBuffer, offset?: number, endianness?: boolean);
    buffer: ArrayBuffer;
    position: number;
  }
}
