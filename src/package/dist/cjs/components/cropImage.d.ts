export function getRadianAngle(degreeValue: any): number;
/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: any, height: any, rotation: any): {
    width: number;
    height: number;
};
/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
export default function getCroppedImg(imageSrc: any, pixelCrop: any, rotation?: number, flip?: {
    horizontal: boolean;
    vertical: boolean;
}): Promise<any>;
export function createImage(url: any): Promise<any>;
