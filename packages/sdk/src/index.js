export function defineScanner(scanner) {
  return {
    kind: 'scanner',
    ...scanner
  };
}

export function defineEnricher(enricher) {
  return {
    kind: 'enricher',
    ...enricher
  };
}
