// Déclarations minimales pour l'API navigateur BarcodeDetector (non incluse dans lib.dom).
// https://developer.mozilla.org/docs/Web/API/BarcodeDetector
export {};

declare global {
	interface DetectedBarcode {
		rawValue: string;
		format: string;
		boundingBox: DOMRectReadOnly;
		cornerPoints: ReadonlyArray<{ x: number; y: number }>;
	}

	interface BarcodeDetectorOptions {
		formats?: string[];
	}

	class BarcodeDetector {
		constructor(options?: BarcodeDetectorOptions);
		static getSupportedFormats(): Promise<string[]>;
		detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
	}

	interface Window {
		BarcodeDetector?: typeof BarcodeDetector;
	}
}
