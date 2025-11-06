import { Platform, Share } from 'react-native';
import { File, Paths } from 'expo-file-system';

export async function downloadExcel(base64Data: string, filename: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      const blob = base64ToBlob(base64Data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const file = new File(Paths.cache, filename);
      const bytes = base64ToBytes(base64Data);
      file.write(bytes);

      await Share.share({
        url: file.uri,
        message: `Archivo exportado: ${filename}`,
      });
    }
  } catch (error) {
    console.error('Error downloading excel:', error);
    throw error;
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

function base64ToBytes(base64: string): Uint8Array {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Uint8Array(byteNumbers);
}
