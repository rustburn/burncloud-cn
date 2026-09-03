export interface AigcMetadata {
  AIGC: {
    Label: string;
    ContentProducer: string;
    ProduceID: string;
    ReservedCode1: string;
    ContentPropagator: string;
    PropagateID: string;
    ReservedCode2: string;
  };
}

export const DEFAULT_CONTENT_PRODUCER = '广州奔云人工智能科技有限公司';
export const DEFAULT_CONTENT_PROPAGATOR = '广州奔云人工智能科技有限公司';

export function generateProduceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `BC-AIGC-${crypto.randomUUID()}`;
  }
  // Fallback UUID v4 generator
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  const uuid = `${s4()}${s4()}-${s4()}-4${s4().substr(0, 3)}-${s4()}-${s4()}${s4()}${s4()}`;
  return `BC-AIGC-${uuid}`;
}

export function generateAigcMetadata(
  producer: string = DEFAULT_CONTENT_PRODUCER,
  propagator: string = DEFAULT_CONTENT_PROPAGATOR
): AigcMetadata {
  const produceId = generateProduceId();
  return {
    AIGC: {
      Label: '1',
      ContentProducer: producer || DEFAULT_CONTENT_PRODUCER,
      ProduceID: produceId,
      ReservedCode1: '',
      ContentPropagator: propagator || DEFAULT_CONTENT_PROPAGATOR,
      PropagateID: produceId,
      ReservedCode2: '',
    },
  };
}
