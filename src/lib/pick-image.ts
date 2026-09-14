import * as Device from 'expo-device';

import type { ImageContentType } from './api/types';

export type PickedImage = { uri: string; contentType: ImageContentType };

// expo-image-picker 네이티브 모듈이 없는(리빌드 전) dev client에서 구분하기 위한 에러.
export class ImagePickerUnavailableError extends Error {
  constructor() {
    super('expo-image-picker 네이티브 모듈을 찾을 수 없습니다.');
    this.name = 'ImagePickerUnavailableError';
  }
}

// 백엔드가 허용하는 콘텐츠 타입만 통과. mimeType → 확장자 → jpeg 순으로 추론한다.
const ALLOWED: Record<string, ImageContentType> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
};

// 실기기 여부. expo-device 네이티브가 없어 접근이 실패하면 안전하게 false(크롭 생략)로 본다.
function isRealDevice(): boolean {
  try {
    return Device.isDevice;
  } catch {
    return false;
  }
}

function resolveContentType(mimeType: string | undefined, uri: string): ImageContentType {
  if (mimeType && ALLOWED[mimeType]) return ALLOWED[mimeType];
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

// 리빌드 전 dev client에서는 native 모듈이 없어 import 또는 첫 호출에서 이 형태의 에러가 난다.
function isNativeModuleMissing(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /native module|ExpoImagePicker|requireNativeModule/i.test(msg);
}

export type PickImageOptions = {
  /** true면 선택 후 크롭 UI. 대표 사진은 정사각 크롭, OCR용 원본은 false 권장. */
  allowsEditing?: boolean;
  /** allowsEditing=true일 때 크롭 비율. */
  aspect?: [number, number];
};

/**
 * 갤러리에서 이미지 1장 선택. 취소·권한거부 시 null.
 * expo-image-picker는 네이티브 모듈이라 정적 import하면 리빌드 전 앱이 크래시하므로
 * 사용 시점에 동적 import한다. 모듈이 없으면(import 실패 또는 호출 시)
 * ImagePickerUnavailableError로 변환해 화면이 우아하게 안내하도록 한다.
 */
export async function pickImage(opts: PickImageOptions = {}): Promise<PickedImage | null> {
  let ImagePicker: typeof import('expo-image-picker');
  try {
    ImagePicker = await import('expo-image-picker');
  } catch {
    throw new ImagePickerUnavailableError();
  }

  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;

    // allowsEditing=true는 iOS에서 구형 UIImagePickerController(내장 크롭)를 띄우는데,
    // 시뮬레이터/에뮬레이터에선 이 피커가 크래시(MobileSlideShow 종료)한다.
    // → 실기기에서만 크롭 사용. 시뮬레이터에선 생략(표시는 어차피 정사각 cover-fit).
    const allowsEditing = (opts.allowsEditing ?? false) && isRealDevice();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing,
      aspect: allowsEditing ? opts.aspect : undefined,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];
    return { uri: asset.uri, contentType: resolveContentType(asset.mimeType, asset.uri) };
  } catch (e) {
    if (isNativeModuleMissing(e)) throw new ImagePickerUnavailableError();
    throw e;
  }
}

/** 대표 사진용 — 정사각 크롭. */
export const pickSquareImage = () => pickImage({ allowsEditing: true, aspect: [1, 1] });
