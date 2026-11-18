import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.5,
  exif: false,
  base64: false,
};

export async function pickMedicalImage(source: 'camera' | 'library'): Promise<string | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;
  } else {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function compressOnWeb(uri: string): Promise<string> {
  if (typeof document === 'undefined') return uri;

  const image = await withTimeout(
    new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Could not read the photo'));
      element.src = uri;
    }),
    6000,
  );

  const scale = Math.min(1, 1080 / Math.max(image.width, 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the photo');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.45);
}

export async function compressMedicalImage(uri: string): Promise<string> {
  if (uri.startsWith('data:image/') && uri.length < 400_000) return uri;

  if (Platform.OS === 'web') {
    return compressOnWeb(uri);
  }

  const result = await withTimeout(
    manipulateAsync(uri, [{ resize: { width: 1080 } }], {
      compress: 0.45,
      format: SaveFormat.JPEG,
      base64: true,
    }),
    8000,
  );

  if (!result.base64) {
    throw new Error('Could not prepare the photo');
  }

  return `data:image/jpeg;base64,${result.base64}`;
}
